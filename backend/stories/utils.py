import re


WORDS_PER_MINUTE = 225
SECONDS_PER_IMAGE = 12


def calculate_read_time(content):
    """
    Calculate estimated reading time based on:
    - Text word count
    - Markdown images
    - 225 words per minute
    - 12 seconds reading time per image
    """

    if not content:
        return 1

    # --------------------------------------------------
    # 1. Count Markdown images
    # Example: ![Alt text](image.jpg)
    # --------------------------------------------------
    image_pattern = r'!\[.*?\]\(.*?\)'
    image_count = len(re.findall(image_pattern, content))

    # --------------------------------------------------
    # 2. Remove Markdown code blocks
    # Code should not be counted as normal reading words
    # --------------------------------------------------
    content = re.sub(
        r'```[\s\S]*?```',
        '',
        content
    )

    # --------------------------------------------------
    # 3. Remove Markdown images
    # --------------------------------------------------
    content = re.sub(
        image_pattern,
        '',
        content
    )

    # --------------------------------------------------
    # 4. Remove Markdown links
    # Keep the visible link text
    # Example: [Django](https://djangoproject.com)
    # becomes: Django
    # --------------------------------------------------
    content = re.sub(
        r'\[([^\]]+)\]\([^)]+\)',
        r'\1',
        content
    )

    # --------------------------------------------------
    # 5. Remove Markdown heading markers
    # Example:
    # ### Introduction
    # becomes:
    # Introduction
    # --------------------------------------------------
    content = re.sub(
        r'^\s*#{1,6}\s+',
        '',
        content,
        flags=re.MULTILINE
    )

    # --------------------------------------------------
    # 6. Remove bold and italic Markdown markers
    # --------------------------------------------------
    content = re.sub(
        r'(\*\*|__|\*|_)',
        '',
        content
    )

    # --------------------------------------------------
    # 7. Count remaining words
    # --------------------------------------------------
    word_count = len(content.split())

    # --------------------------------------------------
    # 8. Calculate text reading time
    # --------------------------------------------------
    text_seconds = (
        word_count / WORDS_PER_MINUTE
    ) * 60

    # --------------------------------------------------
    # 9. Add image reading time
    # --------------------------------------------------
    image_seconds = (
        image_count * SECONDS_PER_IMAGE
    )

    # --------------------------------------------------
    # 10. Calculate total reading time
    # --------------------------------------------------
    total_seconds = text_seconds + image_seconds

    # Always return at least 1 minute
    return max(
        1,
        round(total_seconds / 60)
    )