from github import Github
import os

TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "Coder5O/amibia-travel-share"
BRANCH = "ai-updates"

g = Github(TOKEN)
repo = g.get_repo(REPO_NAME)

def update_file(file_path, new_content, commit_message):
    try:
        contents = repo.get_contents(file_path, ref=BRANCH)
        repo.update_file(
            contents.path,
            commit_message,
            new_content,
            contents.sha,
            branch=BRANCH
        )
    except:
        repo.create_file(
            file_path,
            commit_message,
            new_content,
            branch=BRANCH
        )
