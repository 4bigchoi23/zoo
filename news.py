"""News Crawler"""
# news.py
# -*- coding:utf-8 -*-
# pylint: disable=C0103

import os
import re
from datetime import datetime, timedelta
from pytz import timezone
import requests
from bs4 import BeautifulSoup
from github import Github

def get_html(url):
    """HTML Parser"""
    data = requests.get(url, timeout=10)
    html = data.text
    return html

def get_news(section, url):
    """Extract News"""
    contents = ''
    if url.find('editorial') == -1:
        html = get_html(url)
        soup = BeautifulSoup(html, 'html.parser')
        news = soup.select(".as_headline > .sa_list > .sa_item")
        for item in news:
            title = item.select(".sa_text_title")[0].text.strip()
            href = item.select(".sa_text_title")[0].attrs['href']
            desc = item.select(".sa_text_lede")[0].text.strip()
            desc = re.sub('([#_\\-\\*\\~])', r'\\\1', desc)
            press = item.select(".sa_text_press")[0].text.strip()
            content = f"- [{title}]({href}) {press}  \n{desc}  \n"
            contents += content
    else:
        html = ''
        for p in range(1, 5):
            page = url + '&page=' + str(p)
            html += get_html(page)
        soup = BeautifulSoup(html, 'html.parser')
        news = soup.select(".opinion_editorial_list > .opinion_editorial_item")
        for item in news:
            title = item.select(".description")[0].text.strip()
            href = item.select(".link")[0].attrs['href']
            press = item.select(".press_name")[0].text.strip()
            content = f"- {press} [{title}]({href})  \n"
            contents += content
    return f"# {section}  \n\n{contents}\n\n"

if __name__ == "__main__":
    access_token = os.environ['GH_TOKEN']
    repository_name = "tmp"

    seoul_timezone = timezone('Asia/Seoul')
    today = datetime.now(seoul_timezone)
    today_date = today.strftime("%Y년 %m월 %d일")
    yesterday = today - timedelta(days=1)
    editorial_date = yesterday.strftime("%Y%m%d")

    issue_title = f"분야별 주요 뉴스 - {today_date}"
    issue_contents = ''

    news_section = {
        '정치': 'https://news.naver.com/section/100',
        '경제': 'https://news.naver.com/section/101',
        '사회': 'https://news.naver.com/section/102',
        '생활/문화': 'https://news.naver.com/section/103',
        'IT/과학': 'https://news.naver.com/section/105',
        '세계': 'https://news.naver.com/section/104',
        '사설(어제)': 'https://news.naver.com/opinion/editorial?date=' + editorial_date
    }

    for key, value in news_section.items():
        issue_contents += get_news(key, value)

    g = Github(access_token)
    repo = g.get_user().get_repo(repository_name)
    repo.create_issue(title=issue_title, body=issue_contents, labels=['news'])

    print(issue_title)
