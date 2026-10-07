import re

from urllib.parse import urlparse

import bleach
import markdown


ALLOWED_TAGS = [
    'p',
    'br',
    'strong',
    'em',
    'del',
    'blockquote',
    'pre',
    'code',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'hr',
    'iframe',
]


ALLOWED_ATTRIBUTES = {
    'a': [
        'href',
        'title',
    ],
    'img': [
        'src',
        'alt',
        'title',
    ],
    'iframe': [
        'src',
        'width',
        'height',
        'title',
        'allow',
        'allowfullscreen',
        'frameborder',
    ],
}


ALLOWED_PROTOCOLS = [
    'http',
    'https',
    'mailto',
]


ALLOWED_EMBED_HOSTS = {
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'youtube-nocookie.com',
}


def is_safe_embed_url(url):
    """
    Allow only HTTPS YouTube embed URLs.
    """
    try:
        parsed = urlparse(url)
    except ValueError:
        return False

    if parsed.scheme != 'https':
        return False

    if parsed.netloc.lower() not in ALLOWED_EMBED_HOSTS:
        return False

    return parsed.path.startswith('/embed/')


def filter_allowed_attributes(tag, name, value):
    """
    Allow safe attributes for links, images,
    and approved YouTube iframes.
    """

    if tag == 'a':
        return name in {
            'href',
            'title',
        }

    if tag == 'img':
        if name == 'src':
            return value.startswith(('http://', 'https://'))

        return name in {
            'alt',
            'title',
        }

    if tag == 'iframe':
        if name == 'src':
            return is_safe_embed_url(value)

        return name in {
            'width',
            'height',
            'title',
            'allow',
            'allowfullscreen',
            'frameborder',
        }

    return False


def render_safe_markdown(content):
    """
    Convert Markdown to HTML and sanitize the resulting HTML.
    """

    if not content:
        return ''

    # Remove dangerous HTML blocks before Markdown processing.
    content = re.sub(
        r'<(script|style|object|embed)[^>]*>.*?</\1>',
        '',
        content,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # Convert Markdown to HTML.
    html = markdown.markdown(
        content,
        extensions=[
            'extra',
            'fenced_code',
            'sane_lists',
        ],
    )

    # Remove iframe elements that are not approved YouTube embeds.
    def remove_unsafe_iframe(match):
        iframe = match.group(0)

        src_match = re.search(
            r'src=["\']([^"\']+)["\']',
            iframe,
            flags=re.IGNORECASE,
        )

        if not src_match:
            return ''

        if not is_safe_embed_url(src_match.group(1)):
            return ''

        return iframe

    html = re.sub(
        r'<iframe\b[^>]*>.*?</iframe\s*>',
        remove_unsafe_iframe,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # Final HTML sanitization.
    clean_html = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=filter_allowed_attributes,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )

    return clean_html