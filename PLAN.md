1. Chuẩn bị ban đầu

Trước khi code, bạn cần xác định rõ:

1.1 Mục tiêu đề tài

Hệ thống có khả năng:

Theo dõi hành vi gõ phím của người dùng

Phân tích keystroke dynamics

Phát hiện keyboard injection (BadUSB)

Cảnh báo hoặc giảm thiểu hành vi đáng ngờ

1.2 Phạm vi hệ thống

Hệ thống sẽ:

Phát hiện:

keyboard HID injection
macro typing
script typing

Không tập trung vào:

malware detection
network attack
USB firmware analysis
1.3 Kiến trúc hệ thống

Pipeline chính:

Keyboard events
     ↓
Input Collector
     ↓
Feature Extractor
     ↓
Behavior Analyzer
     ↓
Risk Score Engine
     ↓
Response Policy
     ↓
Alert / Block
2. Công nghệ & công cụ nên dùng
2.1 Ngôn ngữ chính

Rust

Vì:

hiệu năng cao

an toàn bộ nhớ

phù hợp tool chạy nền

2.2 Library Rust
Thu sự kiện bàn phím

Có thể dùng:

rdev
device_query
evdev (Linux)

Khuyến nghị:

rdev

vì cross-platform.

2.3 Phân tích dữ liệu

Dùng Python cho ML và visualization.

Thư viện:

pandas
numpy
scikit-learn
matplotlib
seaborn
2.4 Dashboard demo

Có thể dùng:

Streamlit

Rất nhanh để làm dashboard.

2.5 Format dữ liệu

Dataset lưu:

CSV

Feature dataset:

CSV hoặc Parquet
3. Giai đoạn 1 — Xây dựng Keystroke Collector
Mục tiêu

Thu thập dữ liệu keystroke.

Những gì cần ghi

Mỗi sự kiện:

timestamp
key_code
event_type (down/up)

Ví dụ log:

timestamp,key,event
100123,A,down
100234,A,up
100250,N,down
100360,N,up
Output

File:

keystroke_log.csv
Module
input_capture.rs
logger.rs
main.rs
Kết quả giai đoạn 1

Tool chạy nền:

keystroke_collector.exe
4. Giai đoạn 2 — Feature Extraction

Sau khi có dataset.

Bạn viết script Python để tính feature.

4.1 Hold Time
HT = key_up - key_down
4.2 Flight Time
FT = down(i+1) - down(i)
4.3 Feature statistics

Trong mỗi cửa sổ 30–60 phím:

mean_hold_time
std_hold_time
mean_flight_time
std_flight_time
CV
typing_speed
Output

File:

features_dataset.csv
5. Giai đoạn 3 — Thu dataset thực nghiệm
Số lượng người
50–100 users
Mỗi người

2–3 session.

Mỗi session:

3–5 phút
Kịch bản gõ
Scenario 1

Gõ đoạn văn.

Scenario 2

Gõ chuỗi ký tự random.

Scenario 3

Free typing.

Metadata

Lưu thêm:

user_id
session_id
keyboard_type
6. Giai đoạn 4 — Tạo dữ liệu injection

Bạn cần dataset tấn công.

Injection simulation

Viết script gửi phím.

Ví dụ:

hello world

gửi:

20ms / key
Pattern injection

BadUSB thường có:

very fast typing
very low variance
long burst typing
7. Giai đoạn 5 — Detection Engine

Bạn xây dựng 2 loại detector.

7.1 Rule-based detection

Ví dụ:

Nếu:

mean_flight_time < 30ms
AND
CV < 0.1

→ suspicious.

Rule khác:

40 keys typed < 1 second
7.2 Machine Learning detection

Model gợi ý:

Isolation Forest

Hoặc:

One-Class SVM

Input:

feature vectors

Output:

anomaly score
7.3 Hybrid detection

Kết hợp:

final_score =
0.6 * rule_score +
0.4 * anomaly_score
8. Giai đoạn 6 — Response Engine

Khi phát hiện bất thường.

Level 1

Cảnh báo.

Ví dụ:

Suspicious typing behavior detected
Level 2

Drop input tạm thời.

Level 3

Yêu cầu xác minh.

Ví dụ:

Press: A + 7 + K
9. Giai đoạn 7 — Dashboard demo

Dashboard hiển thị:

Typing speed
keys per minute
Flight time distribution

Graph:

Human typing
BadUSB typing
Detection log
timestamp
score
action
10. Giai đoạn 8 — Đánh giá hệ thống

Bạn cần test system.

Test cases
Human typing

normal users.

Fast typist

gõ rất nhanh.

Injection simulation

script typing.

Metrics
Detection Rate
False Positive Rate
Latency

Ví dụ kết quả:

Detection rate: 94%
False positive: 3%
Latency: 150ms
11. Sản phẩm cuối cùng của đồ án

Bạn cần có 5 sản phẩm chính.

1. Tool phát hiện BadUSB

Rust program:

kds_guard.exe

Chức năng:

capture keystroke
analyze typing pattern
detect anomalies
alert user
2. Dataset keystroke dynamics

File:

keystroke_dataset.csv

Bao gồm:

50–100 users
human typing
simulated injection
3. Detection model

File:

model.pkl
4. Dashboard demo

Web dashboard:

typing graph
anomaly score
attack detection
5. Báo cáo khoa học

Báo cáo gồm:

Introduction
Threat Model
Dataset
Feature Engineering
Detection Algorithm
Evaluation
Limitations
12. Demo khi bảo vệ

Kịch bản demo:

Step 1

Chạy tool:

KDS Guard monitoring keyboard
Step 2

Gõ bình thường.

System:

Behavior: Normal
Step 3

Chạy script injection.

System:

⚠ HID Injection Detected
Step 4

System block input.

13. Timeline triển khai (10 tuần)
Tuần 1–2

Keyboard collector.

Tuần 3

Feature extraction.

Tuần 4

Rule-based detector.

Tuần 5–6

Dataset collection.

Tuần 7

ML model.

Tuần 8

Hybrid detection.

Tuần 9

Evaluation.

Tuần 10

Report + demo.

14. Lời khuyên rất quan trọng

Đừng bắt đầu từ:

machine learning

Hãy bắt đầu từ:

keyboard event capture

Vì:

nếu không có dataset tốt → đề tài sẽ fail.