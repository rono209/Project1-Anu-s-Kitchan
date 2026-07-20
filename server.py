from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from pathlib import Path
import json
import re

ROOT = Path(__file__).parent
DATA_DIR = ROOT / 'data'
ORDERS_FILE = DATA_DIR / 'orders.json'
PORT = 3000

DATA_DIR.mkdir(parents=True, exist_ok=True)
if not ORDERS_FILE.exists():
    ORDERS_FILE.write_text('[]', encoding='utf-8')


def load_orders():
    try:
        return json.loads(ORDERS_FILE.read_text(encoding='utf-8') or '[]')
    except json.JSONDecodeError:
        return []


def save_orders(orders):
    ORDERS_FILE.write_text(json.dumps(orders, indent=2), encoding='utf-8')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _set_json_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/orders':
            orders = load_orders()
            self._set_json_headers(200)
            self.wfile.write(json.dumps(orders).encode('utf-8'))
            return

        if self.path == '/' or self.path == '/index.html':
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/api/orders':
            self.send_error(404, 'Not Found')
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._set_json_headers(400)
            self.wfile.write(json.dumps({'error': 'Invalid JSON body'}).encode('utf-8'))
            return

        required = ['customerName', 'phone', 'address', 'dish', 'quantity']
        if not all(payload.get(field) for field in required):
            self._set_json_headers(400)
            self.wfile.write(json.dumps({'error': 'Missing required order fields.'}).encode('utf-8'))
            return

        orders = load_orders()
        new_order = {
            'id': str(int(Path().absolute().stat().st_ctime_ns if False else int(__import__('time').time() * 1000))),
            'customerName': payload['customerName'],
            'phone': payload['phone'],
            'address': payload['address'],
            'dish': payload['dish'],
            'quantity': payload['quantity'],
            'notes': payload.get('notes', ''),
            'createdAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
        }
        orders.insert(0, new_order)
        save_orders(orders)

        self._set_json_headers(201)
        self.wfile.write(json.dumps(new_order).encode('utf-8'))

    def do_DELETE(self):
        parsed = urlparse(self.path)
        match = re.match(r'^/api/orders/(?P<id>[^/]+)$', parsed.path)
        if not match:
            self.send_error(404, 'Not Found')
            return

        order_id = match.group('id')
        orders = load_orders()
        remaining = [order for order in orders if order.get('id') != order_id]
        if len(remaining) == len(orders):
            self._set_json_headers(404)
            self.wfile.write(json.dumps({'error': 'Order not found.'}).encode('utf-8'))
            return

        save_orders(remaining)
        self._set_json_headers(204)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'Serving HTTP on http://localhost:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        print('Server stopped.')
