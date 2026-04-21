from github import Github
import os

TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "Coder5O/amibia-travel-share"
BRANCH = "ai-updates"

g = Github(TOKEN)
repo = g.get_repo(REPO_NAME)

def update_file(file_path, new_content, message):
    try:
        file = repo.get_contents(file_path, ref=BRANCH)

        repo.update_file(
            file.path,
            message,
            new_content,
            file.sha,
            branch=BRANCH
        )
    except:
        repo.create_file(
            file_path,
            message,
            new_content,
            branch=BRANCH
        )
