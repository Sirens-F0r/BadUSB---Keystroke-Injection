# Chương 4. KẾT LUẬN VÀ KIẾN NGHỊ

## 4.1. Kết luận

Đề tài "Phát hiện và ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích dữ liệu động học gõ phím (Keystroke Dynamics)" đã hoàn thành các mục tiêu đề ra:

**Về hệ thống:** Đã thiết kế và triển khai thành công hệ thống KDS Guard gồm 5 module Rust (Input Capture, Logger, Feature Extraction, Detection Engine, Policy Engine) và tầng phân tích Python (Train, Evaluate, Visualize, Dashboard). Hệ thống hoạt động real-time trên Windows, phát hiện keystroke injection với **F1-Score = 1.0** và **latency < 0.5ms/sample**.

**Về dữ liệu:** Đã xây dựng bộ dữ liệu **21,035 feature vectors** từ 3 nguồn: CMU Benchmark (51 users, 20,400 vectors), tự thu thập (Python + Rust Collector), và injection mô phỏng (4 loại, 232 vectors).

**Về phát hiện:** Đã đánh giá 5 phương pháp — Rule-based, Isolation Forest, One-Class SVM, Random Forest, Hybrid. Kết quả cho thấy Rule-based, Random Forest, và Hybrid đạt **Accuracy = 100%, F1 = 1.0, AUC = 1.0** trên dataset hiện tại, với **Zero False Positives**.

**Về ngăn chặn:** Đã triển khai Policy Engine 3 mức phản ứng (Alert, Soft Block, Challenge) với cơ chế cooldown chống spam cảnh báo.

## 4.2. Hạn chế

- Dữ liệu injection hiện tại được mô phỏng bằng phần mềm, chưa sử dụng thiết bị BadUSB vật lý (USB Rubber Ducky, DigiSpark).
- Dataset imbalanced: injection chỉ chiếm 1.1% → cần thận trọng khi đánh giá.
- Nếu attacker mô phỏng timing giống người thật (thêm random jitter), hệ thống có thể bị qua mặt.
- Người dùng sử dụng macro, password manager auto-fill có thể bị báo nhầm (False Positive).
- Chỉ hỗ trợ Windows, chưa có GUI (system tray, notification).
- Soft Block chỉ hiển thị cảnh báo, chưa thực sự drop keystroke events (cần kernel-level driver).

## 4.3. Hướng phát triển

**Ngắn hạn:**
- Thu thập thêm dữ liệu người thật (100+ người), đa dạng hóa kịch bản gõ.
- Test với thiết bị BadUSB thật (USB Rubber Ducky, DigiSpark).
- Phát triển GUI: system tray icon, toast notification.
- User-adaptive baselining: hệ thống tự học profile gõ phím riêng cho mỗi người.

**Trung hạn:**
- Device Fingerprinting: kết hợp phân tích timing với USB device descriptor (VID/PID).
- Deep Learning: thử nghiệm LSTM/Transformer trên chuỗi keystroke raw.
- Cross-platform: Port sang Linux và macOS.
- Integration với EDR: xuất alert sang SIEM/Windows Event Log.

**Dài hạn:**
- Kernel-level driver: block keystrokes thực sự (không chỉ alert).
- Zero-Trust USB: chỉ cho phép HID từ trusted devices.
- Federated Learning: mỗi máy tự train model local, share parameters.
