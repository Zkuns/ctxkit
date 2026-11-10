#!/usr/bin/env python3
"""Copy selected skills into an explicit host directory without overwriting."""

import argparse
from pathlib import Path
import shutil
import sys


SKILLS_ROOT = Path(__file__).resolve().parents[1] / "skills"


def available_skills():
    return sorted(p.name for p in SKILLS_ROOT.iterdir() if (p / "SKILL.md").is_file())


def install(target, names, dry_run=False):
    target = Path(target).expanduser().resolve()
    if target == SKILLS_ROOT or SKILLS_ROOT in target.parents:
        raise ValueError("Installation target must be outside the source skills directory.")
    if target.exists() and not target.is_dir():
        raise ValueError(f"Target is not a directory: {target}")

    names = list(dict.fromkeys(names))
    for name in names:
        if name not in available_skills():
            raise ValueError(f"Unknown skill: {name}")
        destination = target / name
        if destination.exists() or destination.is_symlink():
            raise ValueError(f"Destination already exists; nothing installed: {destination}")

    if dry_run:
        for name in names:
            print(f"Would install: {target / name}")
        return

    target.mkdir(parents=True, exist_ok=True)
    created = []
    try:
        for name in names:
            destination = target / name
            # mkdir reserves a new destination and fails even on a broken symlink.
            destination.mkdir()
            created.append(destination)
            shutil.copytree(
                SKILLS_ROOT / name,
                destination,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store"),
            )
    except OSError:
        for destination in reversed(created):
            try:
                shutil.rmtree(destination)
            except OSError as error:
                print(f"Could not clean incomplete install {destination}: {error}", file=sys.stderr)
        raise

    for destination in created:
        print(f"Installed: {destination}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", required=True, help="Your client's skills directory")
    parser.add_argument("--skill", action="append", choices=available_skills(), help="Repeat to select skills; defaults to all")
    parser.add_argument("--dry-run", action="store_true", help="Validate destinations and print the plan without writing")
    args = parser.parse_args()
    try:
        install(args.target, args.skill or available_skills(), args.dry_run)
    except (OSError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
