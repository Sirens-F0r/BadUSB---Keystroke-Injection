#!/usr/bin/env python3
"""
KDS Guard WebSocket Bridge
Ket noi Rust engine voi Dashboard qua WebSocket.

Cach dung:
  python ws_bridge.py

Pipeline:
  kds_guard.exe --json-output | python ws_bridge.py
  Hoac:
  python ws_bridge.py  (tu dong chay kds_guard.exe)

Dashboard ket noi WebSocket tai ws://localhost:8765
"""

import asyncio
import json
import subprocess
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

try:
    import websockets
except ImportError:
    print("Cai dat websockets: pip install websockets")
    sys.exit(1)

# Danh sach client dang ket noi
CLIENTS = set()

# Duong dan den kds_guard.exe
KDS_GUARD_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "kds_guard", "target", "release", "kds_guard.exe"
)

# Fallback: dung debug build
if not os.path.exists(KDS_GUARD_PATH):
    KDS_GUARD_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "kds_guard", "target", "debug", "kds_guard.exe"
    )


async def register(websocket):
    """Dang ky client moi"""
    CLIENTS.add(websocket)
    print(f"[BRIDGE] Client ket noi: {websocket.remote_address} (tong: {len(CLIENTS)})")
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)
        print(f"[BRIDGE] Client ngat: {websocket.remote_address} (tong: {len(CLIENTS)})")


async def broadcast(message):
    """Gui du lieu den tat ca client"""
    if CLIENTS:
        await asyncio.gather(
            *[client.send(message) for client in CLIENTS],
            return_exceptions=True
        )


async def read_stdin():
    """Doc JSON tu stdin (pipe tu kds_guard.exe)"""
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        line = line.decode().strip()
        if line.startswith("{"):
            try:
                data = json.loads(line)
                await broadcast(json.dumps(data))
                risk = data.get("result", {}).get("risk_level", "?")
                score = data.get("result", {}).get("risk_score", 0)
                print(f"[BRIDGE] >> {risk} (score={score:.2f}) -> {len(CLIENTS)} clients")
            except json.JSONDecodeError:
                pass


async def run_kds_guard():
    """Tu dong chay kds_guard.exe voi --json-output (auto-restart khi crash)"""
    if not os.path.exists(KDS_GUARD_PATH):
        print(f"[BRIDGE] Khong tim thay: {KDS_GUARD_PATH}")
        print("[BRIDGE] Hay build truoc: cargo build --release")
        print("[BRIDGE] Hoac pipe truc tiep: kds_guard.exe --json-output | python ws_bridge.py")
        # Che do cho: chi chay WebSocket server, doi stdin
        await read_stdin()
        return

    max_restarts = 5
    restart_count = 0

    while restart_count < max_restarts:
        print(f"[BRIDGE] Khoi dong: {KDS_GUARD_PATH} --json-output -u test")
        process = await asyncio.create_subprocess_exec(
            KDS_GUARD_PATH, "--json-output", "-u", "test",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )

        while True:
            line = await process.stdout.readline()
            if not line:
                break
            line = line.decode().strip()
            if line.startswith("{"):
                try:
                    data = json.loads(line)
                    await broadcast(json.dumps(data))
                    risk = data.get("result", {}).get("risk_level", "?")
                    score = data.get("result", {}).get("risk_score", 0)
                    print(f"[BRIDGE] >> {risk} (score={score:.2f}) -> {len(CLIENTS)} clients")
                except json.JSONDecodeError:
                    pass

        exit_code = await process.wait()
        restart_count += 1

        if restart_count < max_restarts:
            print(f"[BRIDGE] kds_guard.exe da thoat (code={exit_code}). Tu khoi dong lai sau 3 giay... ({restart_count}/{max_restarts})")
            await asyncio.sleep(3)
        else:
            print(f"[BRIDGE] kds_guard.exe da thoat {max_restarts} lan. Dung bridge.")



async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("==================================================")
    print("  KDS Guard WebSocket Bridge")
    print("  Dashboard ket noi tai: ws://localhost:8765")
    print("==================================================")
    print("[BRIDGE] Khoi dong...")

    # Khoi dong WebSocket server + engine dong thoi
    # WebSocket server + engine chay song song
    async def ws_server_task():
        try:
            async with websockets.serve(register, "localhost", 8765):
                print("[BRIDGE] WebSocket server dang chay tai ws://localhost:8765")
                print("[BRIDGE] Dashboard mo: http://localhost:3000")
                print("[BRIDGE] Dong y bang Ctrl+C de dung.")
                print()
                await asyncio.Future()  # Chờ vĩnh viễn
        except Exception as e:
            print(f"[BRIDGE] WebSocket error: {e}")

    asyncio.ensure_future(ws_server_task())
    await asyncio.sleep(0.5)  # Đợi server khởi động
    asyncio.ensure_future(run_kds_guard())
    await asyncio.Future()  # Chờ vĩnh viễn


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[BRIDGE] Da dung.")
