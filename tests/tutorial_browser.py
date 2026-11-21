"""Compatibility entrypoint for the current FinalCut guided-tour browser test."""
from pathlib import Path
from runpy import run_path
run_path(str(Path(__file__).with_name("v14_2_tutorial_browser.py")),run_name="__main__")
