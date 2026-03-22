# Chương 1. TỔNG QUAN

## 1.1. Đặt vấn đề

Trong bối cảnh an ninh mạng ngày càng phức tạp, các cuộc tấn công thông qua thiết bị USB giả mạo (BadUSB) đã trở thành một trong những mối đe dọa nghiêm trọng đối với hệ thống máy tính cá nhân và doanh nghiệp. Theo báo cáo của Bkav năm 2023, Việt Nam ghi nhận hàng nghìn sự cố liên quan đến mã độc lây lan qua USB, gây thiệt hại đáng kể về dữ liệu và tài chính [1].

BadUSB là một kỹ thuật tấn công trong đó firmware của thiết bị USB được chỉnh sửa để thiết bị tự nhận diện là thiết bị HID (Human Interface Device) — cụ thể là bàn phím — và tự động gửi các chuỗi phím (keystrokes) vào hệ thống mục tiêu. Khác với mã độc truyền thống, BadUSB hoạt động ở tầng phần cứng/firmware, khiến các giải pháp antivirus thông thường rất khó phát hiện.

Kỹ thuật này được MITRE ATT&CK phân loại dưới mã **T1674 — USB/Removable Media-based Initial Access** [3], cho thấy mức độ nghiêm trọng và sự công nhận từ cộng đồng bảo mật quốc tế. Điển hình, nhóm tội phạm mạng **FIN7** đã sử dụng thiết bị BadUSB giả dạng USB quà tặng để tấn công các doanh nghiệp tại Mỹ, khiến FBI phải phát cảnh báo khẩn cấp (Flash Alert CU-000156-MW) vào năm 2022.

Hiện nay, hầu hết các hệ điều hành đều **tự động tin tưởng** mọi thiết bị HID được kết nối qua USB mà không yêu cầu xác thực. Điều này tạo ra lỗ hổng: BadUSB có thể gõ hàng trăm phím trong vài giây, thực thi lệnh độc hại trước khi người dùng kịp phản ứng.

## 1.2. Tính cấp thiết

Các giải pháp phòng chống BadUSB hiện tại chủ yếu dựa trên:

- **USB device whitelisting**: Chỉ cho phép thiết bị đã biết → Hạn chế tính linh hoạt.
- **Endpoint Detection & Response (EDR)**: Giám sát hành vi process → Không hiệu quả với keystroke injection thuần túy.
- **Chữ ký mã độc (signature-based)**: Không phát hiện được tấn công zero-day qua keystroke.

Điểm chung của các giải pháp trên là **không phân tích hành vi gõ phím**. Trong khi đó, sự khác biệt giữa người thật và thiết bị giả mạo thể hiện rõ qua các đặc trưng thời gian: tốc độ gõ, nhịp điệu, độ biến thiên — những yếu tố thuộc lĩnh vực **Keystroke Dynamics** (Động học gõ phím).

Vì vậy, đề tài này đề xuất một hướng tiếp cận mới: sử dụng phân tích Keystroke Dynamics kết hợp học máy (Machine Learning) để phát hiện và ngăn chặn tấn công BadUSB ở mức thời gian thực.

## 1.3. Mục tiêu đề tài

### 1.3.1. Mục tiêu chính

1. **Phát hiện** hành vi chèn phím giả mạo (keystroke injection) từ thiết bị BadUSB bằng phân tích động học gõ phím (Keystroke Dynamics).
2. **Ngăn chặn** tấn công theo chính sách phản ứng nhiều mức: cảnh báo → chặn tạm thời → yêu cầu xác minh người dùng.
3. **Xây dựng bộ dữ liệu** thực nghiệm từ dữ liệu gõ phím của người dùng thật (50+ người) và dữ liệu injection mô phỏng.

### 1.3.2. Mục tiêu cụ thể

- Thiết kế và triển khai module thu thập sự kiện bàn phím (Keyboard Collector) bằng ngôn ngữ Rust.
- Trích xuất 19 đặc trưng động học gõ phím: Hold Time, Flight Time, CV, Burst Pattern.
- Phát triển engine phát hiện 3 tầng: Rule-based → Machine Learning → Hybrid Detection.
- Đánh giá hiệu năng hệ thống trên các chỉ số: Accuracy, F1-Score, AUC-ROC, False Positive Rate, Latency.
- Xây dựng Dashboard trực quan hóa kết quả phân tích.

## 1.4. Đối tượng và phạm vi nghiên cứu

### 1.4.1. Đối tượng nghiên cứu

- Các kỹ thuật tấn công chèn phím qua thiết bị HID giả mạo (BadUSB, USB Rubber Ducky, DigiSpark).
- Đặc trưng thời gian của hành vi gõ phím (Keystroke Dynamics).
- Thuật toán học máy cho phát hiện bất thường (Anomaly Detection).

### 1.4.2. Phạm vi nghiên cứu

**Bao gồm:**
- Phát hiện tấn công chèn phím qua HID keyboard injection trên hệ điều hành Windows.
- Phân tích near-real-time trong cửa sổ 30–60 phím (tương đương 1–3 giây).
- Detection engine kết hợp Rule-based + Machine Learning (Isolation Forest, One-Class SVM, Random Forest).
- 3 mức phản ứng: Alert, Soft Block, Challenge.

**Không bao gồm:**
- Phát hiện ở mức driver/kernel (cần quyền đặc biệt).
- Phân tích nội dung phím gõ (chỉ phân tích timing/rhythm, không lưu nội dung).
- Phòng chống đối thủ mô phỏng hoàn hảo timing người thật.
- Hỗ trợ đa nền tảng (chỉ tập trung Windows).

## 1.5. Phương pháp nghiên cứu

1. **Nghiên cứu lý thuyết**: Phân tích các công trình về BadUSB, Keystroke Dynamics, Anomaly Detection.
2. **Thiết kế hệ thống**: Xây dựng kiến trúc module hóa pipeline: Thu thập → Trích xuất → Phát hiện → Phản ứng.
3. **Thu thập dữ liệu**: Xây dựng bộ dữ liệu từ CMU Benchmark Dataset (51 users) + tự thu thập + mô phỏng injection.
4. **Thực nghiệm**: Huấn luyện mô hình ML, đánh giá và so sánh các phương pháp phát hiện.
5. **Demo**: Trình diễn hệ thống trên tình huống thực tế (human typing vs injection attack).

## 1.6. Cấu trúc đồ án

Đồ án được tổ chức thành 4 chương:

**Chương 1 — Tổng quan**: Giới thiệu đề tài, đặt vấn đề về tấn công BadUSB, trình bày tính cấp thiết, mục tiêu, phạm vi và phương pháp nghiên cứu. Tóm tắt các nghiên cứu liên quan.

**Chương 2 — Cơ sở lý thuyết**: Trình bày nền tảng lý thuyết về USB/HID, kỹ thuật tấn công BadUSB, phân tích Keystroke Dynamics, các thuật toán học máy (Isolation Forest, One-Class SVM, Random Forest), ngôn ngữ Rust, và thiết kế chi tiết hệ thống KDS Guard (kiến trúc, 5 module, 7 luật phát hiện, 3 mức phản ứng).

**Chương 3 — Kết quả thực nghiệm**: Mô tả môi trường thực nghiệm, bộ dữ liệu 21,035 mẫu từ 3 nguồn, kết quả huấn luyện và đánh giá 5 phương pháp phát hiện, phân tích sâu qua 6 biểu đồ, giao diện Dashboard, và kết quả demo.

**Chương 4 — Kết luận và kiến nghị**: Tóm tắt kết quả đạt được, nêu hạn chế và đề xuất hướng phát triển trong tương lai.
