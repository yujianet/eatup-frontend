import argparse
import requests

def download_openapi_json(source):
    if source == '@prod':
        url = 'http://198.18.9.21:8000/openapi.json'
    else:
        url = 'http://127.0.0.1:8000/openapi.json'

    response = requests.get(url)
    if response.status_code == 200:
        with open('openapi.json', 'wb') as f:
            f.write(response.content)
        print(f'Successfully downloaded openapi.json from {url}')
    else:
        print(f'Failed to download openapi.json from {url}. Status code: {response.status_code}')

def main():
    parser = argparse.ArgumentParser(description='Download openapi.json from specified source')
    parser.add_argument('--source', type=str, default='@dev', help='Source of openapi.json, can be @prod or @dev (default: @dev)')

    args = parser.parse_args()
    download_openapi_json(args.source)

if __name__ == '__main__':
    main()
