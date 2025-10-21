# PeerPear
COS333 Project for Centralized, LLM-powered Group Pairing Platform

## How to Run:
The dependencies in this project is managed through poetry.

1. Install poetry following: https://python-poetry.org/docs/

2. Create venv on your local: `poetry config virtualenvs.in-project true` 

3. Install all dependencies with `poetry install`

4. Optionally, to add your own dependencies use `poetry add <dependency group>` to update the .toml and poetry lock files.

5. Run the main backend app using `poetry run python src/wsgi.py`

