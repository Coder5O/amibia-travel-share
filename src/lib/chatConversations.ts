import { supabase } from "@/integrations/supabase/client";

function isRlsViolation(message?: string | null) {
  if (!message) return false;
  return (
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("violates row-level security policy")
  );
}

export function getConversationErrorMessage(message?: string | null) {
  if (!message) return "Conversation creation was blocked.";
  if (isRlsViolation(message)) {
    return "Chat setup is blocked by database permissions. Please ask the app owner to apply the latest Supabase migration.";
  }
  return message;
}

async function getExistingConversationId(currentUserId: string, otherUserId: string) {
  const { data: myConvos, error: myConvosError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myConvosError) {
    return { conversationId: null, error: myConvosError };
  }

  const { data: theirConvos, error: theirConvosError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId);

  if (theirConvosError) {
    return { conversationId: null, error: theirConvosError };
  }

  const myIds = new Set(myConvos?.map((c) => c.conversation_id) || []);
  const commonConvo = theirConvos?.find((c) => myIds.has(c.conversation_id));
  return { conversationId: commonConvo?.conversation_id || null, error: null };
}

export async function startOrGetConversation(currentUserId: string, otherUserId: string) {
  const existing = await getExistingConversationId(currentUserId, otherUserId);
  if (existing.error) {
    return { conversationId: null, error: existing.error };
  }
  if (existing.conversationId) {
    return { conversationId: existing.conversationId, error: null };
  }

  const { data: convo, error: createConvoError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (createConvoError || !convo) {
    return { conversationId: null, error: createConvoError || new Error("Conversation creation was blocked.") };
  }

  const { error: addSelfError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: convo.id, user_id: currentUserId });

  if (addSelfError) {
    return { conversationId: null, error: addSelfError };
  }

  const { error: addOtherError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: convo.id, user_id: otherUserId });

  if (addOtherError) {
    return { conversationId: null, error: addOtherError };
  }

  return { conversationId: convo.id, error: null };
}
