"""Writes a Markdown summary of JUnit XML results, for $GITHUB_STEP_SUMMARY.

Usage: junit-summary.py TITLE FILE...

Prints the counts, each failed test with the first line of its message, and the tests expected
to fail (Playwright's test.fail), which count as passed while they fail. A missing file counts
as a failure, since the tests then didn't run or didn't report.
"""
import sys
import xml.etree.ElementTree as ET


def cell(text):
    return text.replace('|', '\\|')[:300]


title, files = sys.argv[1], sys.argv[2:]
passed = failed = skipped = 0
failures = []
expected = []
for path in files:
    try:
        root = ET.parse(path).getroot()
    except (OSError, ET.ParseError) as e:
        failures.append((path, f'no results: {e}'))
        continue
    for case in root.iter('testcase'):
        problem = case.find('failure')
        if problem is None:
            problem = case.find('error')
        if problem is not None:
            failed += 1
            message = (problem.get('message') or problem.text or '').strip().splitlines()
            failures.append((f"{case.get('classname')} › {case.get('name')}", message[0] if message else ''))
        elif case.find('skipped') is not None:
            skipped += 1
        else:
            passed += 1
        for prop in case.iter('property'):
            if prop.get('name') == 'fail':
                expected.append((f"{case.get('classname')} › {case.get('name')}", prop.get('value') or ''))

icon = '✅' if not failures else '❌'
print(f'### {icon} {title}: {passed} passed, {failed} failed, {skipped} skipped\n')
if failures:
    print('| Test | Message |\n|---|---|')
    for name, message in failures:
        print(f'| {cell(name)} | {cell(message)} |')
    print()
if expected:
    print('Expected to fail:\n')
    for name, reason in expected:
        print(f'- {name}: {reason}')
    print()
