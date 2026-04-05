---
title: "PHÁT HIỆN VÀ NGĂN CHẶN TẤN CÔNG CHÈN PHÍM GIẢ MẠO (BADUSB) BẰNG PHÂN TÍCH DỮ LIỆU ĐỘNG HỌC GÕ PHÍM (KEYSTROKE DYNAMICS)"
author: "[Họ tên sinh viên]"
date: "TP. Hồ Chí Minh, năm 2026"
lang: vi
---

**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM**

**KHOA CÔNG NGHỆ THÔNG TIN**

\

**ĐỒ ÁN CƠ SỞ**

\

**PHÁT HIỆN VÀ NGĂN CHẶN TẤN CÔNG CHÈN PHÍM GIẢ MẠO (BADUSB) BẰNG PHÂN TÍCH DỮ LIỆU ĐỘNG HỌC GÕ PHÍM (KEYSTROKE DYNAMICS)**

\

**Ngành:** Công nghệ Thông tin

**Chuyên ngành:** An toàn thông tin

\

**Giảng viên hướng dẫn:** [Họ tên, học hàm, học vị]

**Sinh viên thực hiện:** [Họ tên sinh viên]

**MSSV:** [Mã số sinh viên]

**Lớp:** [Mã lớp]

\

**TP. Hồ Chí Minh, năm 2026**

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# LỜI MỞ ĐẦU {.unnumbered}

Trong bối cảnh an ninh mạng ngày càng phức tạp, các cuộc tấn công thông qua thiết bị USB giả mạo (BadUSB) đã trở thành mối đe dọa nghiêm trọng đối với hệ thống máy tính. Đồ án này tập trung nghiên cứu và xây dựng hệ thống KDS Guard — phát hiện và ngăn chặn tấn công chèn phím giả mạo bằng phân tích dữ liệu động học gõ phím (Keystroke Dynamics), kết hợp phương pháp Rule-based và Machine Learning.

[Sinh viên có thể bổ sung thêm nội dung lời mở đầu tại đây.]

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# LỜI CẢM ƠN {.unnumbered}

Em xin chân thành cảm ơn thầy/cô [Họ tên giảng viên] đã tận tình hướng dẫn em trong suốt quá trình thực hiện đồ án.

Em cũng xin gửi lời cảm ơn đến quý thầy cô Khoa Công nghệ Thông tin — Trường Đại học Công nghệ TP.HCM đã truyền đạt kiến thức nền tảng để em hoàn thành đồ án này.

[Sinh viên có thể bổ sung thêm nội dung lời cảm ơn tại đây.]

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# NHIỆM VỤ ĐỒ ÁN {.unnumbered}

**Tên đề tài:** Phát hiện và ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích dữ liệu động học gõ phím (Keystroke Dynamics).

**Nhiệm vụ:**

1. Nghiên cứu các kỹ thuật tấn công HID Injection và BadUSB.
2. Thiết kế và triển khai hệ thống thu thập sự kiện bàn phím (Keyboard Collector) bằng ngôn ngữ Rust.
3. Trích xuất đặc trưng động học gõ phím (Keystroke Dynamics Features).
4. Xây dựng engine phát hiện kết hợp Rule-based và Machine Learning.
5. Đánh giá hiệu năng hệ thống trên bộ dữ liệu thực nghiệm.
6. Xây dựng Dashboard trực quan hóa kết quả.

**Ngày giao đồ án:** [Ngày giao]

**Ngày hoàn thành:** [Ngày hoàn thành]

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN {.unnumbered}

\
\
\
\
\
\
\
\
\
\
\
\
\

**Điểm đánh giá:** ......................

**Ngày ..... tháng ..... năm 2026**

**Giảng viên hướng dẫn**

(Ký và ghi rõ họ tên)

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# DANH MỤC HÌNH ẢNH {.unnumbered}

[Danh mục hình ảnh sẽ được tạo tự động trong Word sau khi chèn hình.]

<!-- Hình 3.1. Sơ đồ pipeline hệ thống KDS Guard -->
<!-- Hình 4.1. Demo kết quả phát hiện Human Typing -->
<!-- Hình 4.2. Demo kết quả phát hiện BadUSB Attack -->

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# DANH MỤC BẢNG BIỂU {.unnumbered}

[Danh mục bảng biểu sẽ được tạo tự động trong Word sau khi đánh dấu caption bảng.]

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# DANH MỤC KÝ HIỆU, TỪ VIẾT TẮT {.unnumbered}

| Ký hiệu / Viết tắt | Ý nghĩa |
|---|---|
| USB | Universal Serial Bus |
| HID | Human Interface Device |
| KD | Keystroke Dynamics |
| CV | Coefficient of Variation (Hệ số biến thiên) |
| IF | Isolation Forest |
| OCSVM | One-Class Support Vector Machine |
| RF | Random Forest |
| AUC-ROC | Area Under the Receiver Operating Characteristic Curve |
| FP | False Positive |
| FN | False Negative |
| ML | Machine Learning |
| EDR | Endpoint Detection and Response |
| CMU | Carnegie Mellon University |
| MITRE ATT&CK | Framework phân loại kỹ thuật tấn công mạng |

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI

## Giới thiệu bài toán USB Security

Trong bối cảnh an ninh mạng ngày càng phức tạp, các cuộc tấn công thông qua thiết bị USB giả mạo (BadUSB) đã trở thành một trong những mối đe dọa nghiêm trọng đối với hệ thống máy tính cá nhân và doanh nghiệp. USB (Universal Serial Bus) là chuẩn giao tiếp phổ biến nhất cho kết nối thiết bị ngoại vi, được sử dụng rộng rãi trên hầu hết các máy tính cá nhân và hệ thống doanh nghiệp trên toàn thế giới.

Tuy nhiên, mô hình bảo mật của USB tồn tại lỗ hổng cốt lõi: **hệ điều hành tự động tin tưởng mọi thiết bị HID (Human Interface Device)** được kết nối qua USB mà không yêu cầu xác thực. Điều này có nghĩa là bất kỳ thiết bị nào tự nhận diện là bàn phím đều được hệ điều hành chấp nhận ngay lập tức và cho phép gửi keystroke vào hệ thống — tạo ra cơ hội cho kẻ tấn công chèn phím giả mạo.

BadUSB là một kỹ thuật tấn công trong đó firmware của thiết bị USB được chỉnh sửa (hoặc thiết bị được thiết kế chuyên biệt) để tự nhận diện là thiết bị HID — cụ thể là bàn phím — và tự động gửi các chuỗi phím vào hệ thống mục tiêu. Khác với mã độc truyền thống hoạt động ở tầng phần mềm, BadUSB hoạt động ở tầng phần cứng/firmware, khiến các giải pháp antivirus thông thường rất khó phát hiện.

## Các dạng tấn công USB

### BadUSB (HID Injection)

BadUSB khai thác cơ chế trust model của USB: thiết bị giả mạo tự nhận diện là bàn phím HID, sau đó gõ lệnh tự động vào hệ thống mục tiêu với tốc độ cực nhanh (50–200 phím/giây). Kỹ thuật này được MITRE ATT&CK phân loại dưới mã **T1674 — USB/Removable Media-based Initial Access** [3].

Bảng 1.1. Các thiết bị BadUSB phổ biến

| Thiết bị | Nhà sản xuất | Khả năng |
|---|---|---|
| USB Rubber Ducky | Hak5 | Gõ phím với DuckyScript, delay tùy chỉnh |
| Bash Bunny | Hak5 | Multi-attack: HID + Ethernet + Mass Storage |
| DigiSpark | Digispark | Attiny85-based, giá rẻ (~$2), Arduino-compatible |
| Teensy | PJRC | HID + serial, lập trình C/C++ |
| O.MG Cable | Hak5 | Trông giống cáp sạc bình thường, có WiFi |

### Keystroke Injection

Keystroke Injection là hành vi gửi chuỗi phím tự động vào hệ thống thông qua thiết bị hoặc phần mềm tự động hóa (script typing, macro). Đây là cơ chế cốt lõi mà BadUSB sử dụng để thực thi payload.

Chuỗi tấn công điển hình (Kill Chain):

```text
1. Delivery     → Đưa thiết bị BadUSB đến gần mục tiêu
2. Exploitation → Thiết bị tự nhận diện HID, bắt đầu gõ phím
3. Installation → Tải mã độc, tạo backdoor, thay đổi cấu hình
4. C2           → Kết nối đến máy chủ điều khiển
5. Actions      → Đánh cắp dữ liệu, leo thang quyền
```

### Các dạng tấn công khác

- **USB Mass Storage Attack**: Lây mã độc qua file lưu trên USB.
- **USB Firmware Attack**: Thay đổi firmware thiết bị USB ở mức sâu hơn.
- **Cable-based Attack**: Thiết bị tấn công giấu trong cáp USB (ví dụ O.MG Cable).

## Thực trạng và rủi ro

Theo báo cáo của Bkav năm 2023, Việt Nam ghi nhận hàng nghìn sự cố liên quan đến mã độc lây lan qua USB, gây thiệt hại đáng kể về dữ liệu và tài chính [1]. Trên thế giới, nhóm tội phạm mạng **FIN7** (còn gọi là Carbanak) năm 2021–2022 đã gửi thiết bị BadUSB giả dạng USB quà tặng kèm thẻ quà Best Buy đến nhân viên các công ty Mỹ. Khi cắm, thiết bị tự động mở PowerShell, tải mã độc, tạo backdoor. FBI đã phát cảnh báo Flash Alert CU-000156-MW về chiến dịch này [3].

Bảng 1.2. Số liệu so sánh tốc độ gõ

| Chỉ số | Giá trị |
|---|---|
| Tốc độ gõ BadUSB | 50–200 phím/giây |
| Tốc độ gõ người thật | 5–12 phím/giây |
| Thời gian thực thi payload | 3–10 giây |
| Tỉ lệ phát hiện bởi AV truyền thống | Rất thấp (hoạt động ở tầng HID) |

## Phân tích hạn chế của các phương pháp hiện tại (Research Gap)

Các giải pháp phòng chống BadUSB hiện tại chủ yếu dựa trên:

Bảng 1.3. So sánh các phương pháp phòng chống hiện tại

| Phương pháp | Cách hoạt động | Hạn chế |
|---|---|---|
| USB Device Whitelisting | Chỉ cho phép thiết bị đã biết | Hạn chế tính linh hoạt, không phân biệt được HID giả |
| Endpoint Detection & Response (EDR) | Giám sát hành vi process | Không hiệu quả với keystroke injection thuần túy |
| Chữ ký mã độc (Signature-based) | So khớp pattern mã độc đã biết | Không phát hiện được zero-day qua keystroke |
| Device Fingerprinting | Nhận diện thiết bị qua VID/PID | Dễ bị giả mạo descriptor |

**Research Gap:** Các giải pháp trên **không phân tích hành vi gõ phím**. Trong khi đó, sự khác biệt giữa người thật và thiết bị giả mạo thể hiện rõ qua các đặc trưng thời gian: tốc độ gõ, nhịp điệu, độ biến thiên — những yếu tố thuộc lĩnh vực **Keystroke Dynamics** (Động học gõ phím). Đây chính là khoảng trống nghiên cứu mà đề tài này khai thác.

Bảng 1.4. Các công trình liên quan và hạn chế

| Tác giả | Năm | Nội dung | Hạn chế |
|---|---|---|---|
| Tian et al. [20] | 2019 | Khảo sát tổng thể về tấn công HID và chiến lược phòng thủ | Chỉ ở mức định hướng lý thuyết |
| Zhao & Wang [10] | 2019 | Khảo sát các thiết bị HID độc hại phổ biến | Không đi sâu vào giải pháp phát hiện |
| Nicho & Sabry [12] | 2022 | Mô hình hóa đe dọa (Threat Modeling) cho BadUSB | Không có Detection Engine thực tế |
| Ghosh et al. [13] | 2024 | SAILA: Bảo vệ chống HID attack | Không dùng Keystroke Dynamics |
| Neuner et al. [19] | 2018 | Keystroke Dynamics cho Anti-Spoofing | Không tối ưu cho BadUSB tốc độ cao |

**Điểm khác biệt của đề tài:**

1. Kết hợp Keystroke Dynamics với ML anomaly detection cho bài toán BadUSB.
2. Triển khai bằng Rust (performance) + Python (ML) — hybrid tech stack.
3. Có bộ dữ liệu thực nghiệm từ 50+ người dùng thật (CMU Benchmark).
4. Hybrid Detection 3 tầng — linh hoạt và chính xác.

## Mục tiêu và nhiệm vụ đồ án

### Mục tiêu chính

1. **Phát hiện** hành vi chèn phím giả mạo (keystroke injection) từ thiết bị BadUSB bằng phân tích động học gõ phím (Keystroke Dynamics).
2. **Ngăn chặn** tấn công theo chính sách phản ứng nhiều mức: cảnh báo → chặn tạm thời → yêu cầu xác minh người dùng.
3. **Xây dựng bộ dữ liệu** thực nghiệm từ dữ liệu gõ phím của người dùng thật (50+ người) và dữ liệu injection mô phỏng.

### Nhiệm vụ cụ thể

- Thiết kế và triển khai module thu thập sự kiện bàn phím (Keyboard Collector) bằng ngôn ngữ Rust.
- Trích xuất 16 đặc trưng động học gõ phím: Hold Time, Flight Time, CV, Burst Pattern.
- Phát triển engine phát hiện 3 tầng: Rule-based → Machine Learning → Hybrid Detection.
- Đánh giá hiệu năng hệ thống: Accuracy, F1-Score, AUC-ROC, False Positive Rate, Latency.
- Xây dựng Dashboard trực quan hóa kết quả phân tích.

## Đối tượng và phạm vi

### Đối tượng nghiên cứu

- Các kỹ thuật tấn công chèn phím qua thiết bị HID giả mạo (BadUSB, USB Rubber Ducky, DigiSpark).
- Đặc trưng thời gian của hành vi gõ phím (Keystroke Dynamics).
- Thuật toán học máy cho phát hiện bất thường (Anomaly Detection).

### Phạm vi nghiên cứu

**Bao gồm:**

- Phát hiện tấn công chèn phím qua HID keyboard injection trên hệ điều hành Windows.
- Phân tích near-real-time trong cửa sổ 30–60 phím (tương đương 1–3 giây).
- Detection engine kết hợp Rule-based + Machine Learning (Isolation Forest, One-Class SVM, Random Forest).
- 3 mức phản ứng: Alert, Soft Block, Challenge.

**Không bao gồm:**

- Phát hiện mã độc truyền thống (malware detection).
- Phân tích tấn công mạng (network attack).
- Phân tích firmware USB (USB firmware analysis).
- Phòng chống đối thủ mô phỏng hoàn hảo timing người thật.
- Hỗ trợ đa nền tảng (chỉ tập trung Windows).

## Cấu trúc đồ án

Đồ án được tổ chức thành 5 chương:

- **Chương 1 — Tổng quan đề tài**: Giới thiệu bài toán, đặt vấn đề, thực trạng, research gap, mục tiêu và phạm vi nghiên cứu.
- **Chương 2 — Cơ sở lý thuyết và công nghệ**: Trình bày nền tảng lý thuyết về USB/HID, Keystroke Dynamics, thuật toán học máy, và công nghệ sử dụng.
- **Chương 3 — Giải pháp triển khai**: Thiết kế kiến trúc hệ thống, pipeline xử lý, thu thập dữ liệu, trích xuất đặc trưng, mô hình phát hiện, và cơ chế phản ứng.
- **Chương 4 — Thực nghiệm minh họa**: Môi trường thử nghiệm, dataset, kịch bản test, kết quả triển khai mô hình.
- **Chương 5 — Kết luận và đánh giá**: Tổng kết kết quả, phân tích hạn chế và hướng phát triển.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

## Tổng quan về USB và bảo mật

### Kiến trúc USB

USB (Universal Serial Bus) ra đời năm 1996, trải qua nhiều phiên bản phát triển:

Bảng 2.1. Các phiên bản USB

| Phiên bản | Tốc độ tối đa | Năm ra đời |
|---|---|---|
| USB 1.0 | 1.5 Mbps | 1996 |
| USB 2.0 | 480 Mbps | 2000 |
| USB 3.0 | 5 Gbps | 2008 |
| USB 3.1 | 10 Gbps | 2013 |
| USB 4.0 | 40 Gbps | 2019 |

Kiến trúc USB dựa trên mô hình **host-device**: máy tính (host) điều khiển giao tiếp, thiết bị (device) phản hồi. Khi thiết bị được cắm vào, quá trình **enumeration** diễn ra gồm 5 bước: phát hiện kết nối → reset và gán địa chỉ → lấy descriptor → tải driver → sẵn sàng sử dụng.

### HID và Trust Model

HID (Human Interface Device) là lớp thiết bị USB cho các thiết bị tương tác trực tiếp với con người: bàn phím, chuột, gamepad. Đặc điểm quan trọng:

- **Plug-and-Play**: Driver HID tích hợp sẵn trong OS, không cần cài thêm.
- **Tin tưởng tự động**: Mọi thiết bị tự nhận diện HID đều được OS chấp nhận **không yêu cầu xác thực**.
- **Report-based protocol**: Dữ liệu truyền qua HID Reports.

Cấu trúc HID Report cho Keyboard:

```text
Byte 0:   Modifier keys (Ctrl, Shift, Alt, GUI)
Byte 1:   Reserved (0x00)
Byte 2-7: Key codes (tối đa 6 phím đồng thời)
```

**Lỗ hổng bảo mật cốt lõi:** OS không phân biệt được giữa bàn phím thật và thiết bị giả mạo tự nhận là keyboard HID. Đây là lỗ hổng mà BadUSB khai thác.

## Tấn công HID và Keystroke Injection

### BadUSB

BadUSB là kỹ thuật tấn công trong đó firmware USB được sửa đổi để thiết bị tự nhận diện là HID keyboard hợp lệ. Trong framework MITRE ATT&CK: **Tactic** — Initial Access (TA0001), **Technique** — T1674 — Removable Media [3].

Bảng 2.2. Đặc điểm nhận dạng tấn công BadUSB

| Đặc điểm | Người thật | BadUSB |
|---|---|---|
| Tốc độ gõ | 3–8 phím/giây | 20–200 phím/giây |
| Nhịp gõ | Lung tung, không đều | Rất đều, như máy đếm nhịp |
| Thời gian giữ phím | Dao động nhiều (80–200ms) | Cố định (5–15ms) |
| Gõ sai/xóa | Thường xuyên gõ nhầm | Không bao giờ sai |
| Phím đặc biệt | Ít dùng Ctrl/Alt/Win | Dùng rất nhiều (Win+R, Ctrl+C...) |
| Tạm dừng | Hay dừng để suy nghĩ | Không dừng, gõ liên tục |

### Teensy / Arduino / Rubber Ducky

Các thiết bị phổ biến dùng để triển khai BadUSB:

- **USB Rubber Ducky (Hak5)**: Thiết bị chuyên dụng gõ phím tự động với DuckyScript, delay tùy chỉnh.
- **DigiSpark (Attiny85)**: Giá rẻ (~$2), Arduino-compatible, dễ lập trình payload.
- **Teensy (PJRC)**: HID + serial, lập trình C/C++, linh hoạt.
- **O.MG Cable**: Trông giống cáp sạc bình thường, tích hợp WiFi điều khiển từ xa.

### Cơ chế hoạt động

```text
Cắm thiết bị BadUSB vào máy mục tiêu
        ↓
USB Enumeration: thiết bị tự nhận diện là HID Keyboard
        ↓
OS tải driver HID (tự động, không hỏi người dùng)
        ↓
BadUSB bắt đầu gõ phím tự động (payload):
  - Win+R → mở Run dialog
  - Gõ "powershell" → mở PowerShell
  - Gõ lệnh tải mã độc từ internet
  - Thực thi payload → tạo backdoor
        ↓
Toàn bộ diễn ra trong 3–10 giây
```

## Phát hiện dựa trên hành vi (Behavior-based Detection)

### Keystroke Dynamics

Keystroke Dynamics (Động học gõ phím) nghiên cứu các đặc trưng thời gian khi con người gõ phím. Lĩnh vực này được Monrose và Rubin đặt nền móng nghiên cứu khoa học từ năm 1997 [17], định nghĩa rằng mỗi người có "dấu vân tay gõ phím" riêng biệt giống như sinh trắc học, thể hiện qua thời gian nhấn giữ phím, thời gian giữa các phím, nhịp gõ và tốc độ. Theo nghiên cứu thực nghiệm quy mô lớn của Killourhy và Maxion (CMU) [18], các thuật toán anomaly detection mang lại hiệu quả rất cao trong việc phân biệt các mẫu gõ phím lạ so với chủ nhân thực sự.

**Ý tưởng cốt lõi cho ứng dụng phát hiện BadUSB:** Người thật gõ **CHẬM + KHÔNG ĐỀU + HAY SAI**, trong khi BadUSB gõ **NHANH + RẤT ĐỀU + KHÔNG SAI**. Bằng cách liên tục đo đạc thời gian ở cấp độ mili-giây (ms), ta có thể phân biệt được con người và máy. Nghiên cứu của Neuner et al. (2018) [19] cũng khẳng định các thiết bị giả mạo không thể mô phỏng tự nhiên phương sai sinh học (biological variance) của con người.

### Time Interval — Dwell Time và Flight Time

**Hold Time (Dwell Time)** — Thời gian nhấn giữ phím:

```text
Hold Time = t(key_up) − t(key_down)
```

Người thật: dao động 80–150ms. BadUSB: cố định 5–15ms.

Bảng 2.3. Các biến thể Flight Time

| Loại | Công thức | Sử dụng |
|---|---|---|
| Down-Down (DD) | t_down(i+1) − t_down(i) | **Chính** — phổ biến nhất |
| Up-Down (UD) | t_down(i+1) − t_up(i) | Phản ánh "flight" thực sự |
| Down-Up (DU) | t_up(i) − t_down(i) | Tương tự Hold Time |
| Up-Up (UU) | t_up(i+1) − t_up(i) | Ít dùng |

Đề tài sử dụng **Down-Down (DD)** làm metric chính. Người thật: 100–300ms (biến thiên). BadUSB: 5–25ms (rất đều).

## Phương pháp học máy (Machine Learning)

### Isolation Forest

Thuật toán anomaly detection dựa trên ý tưởng: **điểm bất thường dễ bị cô lập hơn điểm bình thường**. Xây dựng Isolation Trees bằng cách chia ngẫu nhiên — điểm bất thường cần ít bước chia hơn. Ưu điểm: không cần dữ liệu nhãn injection, tốc độ inference O(log n).

### One-Class SVM

Học ranh giới bao quanh phân phối dữ liệu "bình thường". Ánh xạ dữ liệu lên không gian chiều cao (RBF kernel), tìm siêu phẳng tách dữ liệu bình thường khỏi origin. Phù hợp khi chỉ có dữ liệu người thật để huấn luyện.

### Random Forest

Thuật toán ensemble học có giám sát. Xây dựng nhiều cây quyết định trên subset ngẫu nhiên, mỗi cây bỏ phiếu cho nhãn (human/injection). Kết quả = đa số phiếu. Ưu điểm: accuracy cao, chống overfitting, cung cấp feature importance.

### Hybrid Detection (Rule + ML)

```text
Hybrid_Score = 0.6 × Rule_Score + 0.4 × ML_Score
```

Rule-based bắt nhanh các trường hợp rõ ràng (tốc độ siêu nhanh, nhịp đều), ML bắt các trường hợp tinh vi hơn (BadUSB cố tình chạy chậm).

## Công nghệ sử dụng

### Rust — Hook hệ thống

Rust được chọn để phát triển core system (Collector + Detection Engine):

Bảng 2.4. So sánh Rust vs Python vs C/C++

| Tiêu chí | Rust | Python | C/C++ |
|---|---|---|---|
| Memory Safety | Borrow checker, no null | GC-dependent | Manual, dễ lỗi |
| Performance | Zero-cost abstractions | Interpreter | Native code |
| Concurrency | Fearless concurrency | GIL | Race conditions |
| Type Safety | Strict type system | Dynamic | Type coercion |

Microsoft: "70% lỗi bảo mật là do vấn đề memory safety" [7] — Rust giải quyết triệt để.

Bảng 2.5. Các thư viện Rust sử dụng

| Crate | Phiên bản | Mục đích |
|---|---|---|
| rdev | 0.5 | Bắt sự kiện bàn phím (cross-platform) |
| clap | 4.x | Command-line arguments |
| chrono | 0.4 | Timestamp formatting |
| serde | 1.x | Serialization |
| csv | 1.x | Đọc/ghi file CSV |

### Python — Machine Learning

Bảng 2.6. Các thư viện Python sử dụng

| Thư viện | Mục đích |
|---|---|
| scikit-learn | ML models (IF, OCSVM, RF) |
| pandas / numpy | Xử lý dữ liệu |
| matplotlib / seaborn / plotly | Visualization |
| streamlit | Dashboard web |
| pynput | Thu thập keystroke (collector phụ) |

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# CHƯƠNG 3: GIẢI PHÁP TRIỂN KHAI

## Kiến trúc hệ thống đề xuất

Hệ thống KDS Guard được thiết kế theo kiến trúc **pipeline** gồm 5 bước nối tiếp:

```text
USB Event → Collector → Feature Extractor → Detector → Policy Engine → Decision
```

Sơ đồ pipeline chi tiết:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     KDS GUARD — SYSTEM PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bước 1          Bước 2          Bước 3          Bước 4          │
│  Bắt phím   →   Ghi log    →   Tính feature  →  Chấm điểm      │
│  (Collector)     (Logger)       (Extractor)      (Detector)      │
│                                                                  │
│         Bước 5                                                   │
│    →   Phản ứng                                                  │
│        (Policy)                                                  │
│                                                                  │
│  [input_capture.rs] → [logger.rs] → [feature.rs] → [detector.rs]│
│                                                   → [policy.rs]  │
└─────────────────────────────────────────────────────────────────┘
```

Hình 3.1. Sơ đồ pipeline hệ thống KDS Guard

Bảng 3.1. Cấu trúc module Rust (kds_guard/src/)

| Module | File | Kích thước | Chức năng |
|---|---|---|---|
| Input Capture | input_capture.rs | 4.5 KB | Bắt sự kiện bàn phím qua rdev |
| Logger | logger.rs | 4.9 KB | Ghi log CSV (hỗ trợ ẩn danh) |
| Feature | feature.rs | 9.6 KB | Trích xuất 16 đặc trưng |
| Detector | detector.rs | 8.8 KB | 7 luật phát hiện, risk scoring |
| Policy | policy.rs | 5.9 KB | 5 hành động phản ứng |
| Main | main.rs | 9.7 KB | CLI + pipeline orchestration |

Bảng 3.2. Python Analysis Layer

| Script | Kích thước | Chức năng |
|---|---|---|
| train_model.py | 12.9 KB | Huấn luyện IF + OCSVM + RF |
| evaluate.py | 13.0 KB | Đánh giá Rule vs ML vs Hybrid |
| visualize.py | 11.4 KB | 6 loại biểu đồ phân tích |
| dashboard.py | 16.5 KB | Dashboard Streamlit 5 tabs |
| integrate_datasets.py | 31.7 KB | Tích hợp 3 nguồn dataset |
| generate_demo_data.py | 19.5 KB | Tạo dataset demo |

## Thu thập dữ liệu

### Người thật vs thiết bị giả lập

Hệ thống thu thập 2 lớp dữ liệu:

- **Benign (người thật)**: Nhiều người, nhiều phiên, nhiều ngữ cảnh gõ khác nhau.
- **Synthetic/Injected (tiêm phím)**: Dữ liệu "máy" mô phỏng các mẫu injection phổ biến.

Bảng 3.3. Ba nguồn dữ liệu

| Nguồn | Công cụ | Số lượng | Mô tả |
|---|---|---|---|
| CMU Benchmark | Dataset công khai | 51 users, 20,400 vectors | 51 người gõ password 400 lần |
| Python Collector | collect_keystrokes.py | Tự thu thập | Dùng pynput, 3 sessions/người |
| Rust Collector | kds_guard.exe --collect-only | 28 file CSV | Hiệu năng cao, timestamp chính xác |

### Kịch bản thu thập

Mỗi người tham gia thực hiện 2–3 phiên (mỗi phiên 3–5 phút):

- **Session 1 — Gõ đoạn văn tiếng Việt**: Copy text hiển thị để gõ lại, tạo dữ liệu gõ phím bình thường.
- **Session 2 — Gõ chuỗi ngẫu nhiên**: Gõ mật khẩu giả lập / ký tự ngẫu nhiên, tạo pattern khó.
- **Session 3 — Gõ tự do**: Free typing 1–2 phút, dữ liệu tự nhiên nhất.

**Quyền riêng tư và đạo đức:**

- Không lưu nội dung phím (chỉ lưu key_class: alpha/digit/modifier...).
- Hash/ẩn danh participant ID.
- Người tham gia ký consent, có quyền rút dữ liệu.

### Dữ liệu Injection mô phỏng

Bảng 3.4. Bốn loại injection pattern

| Loại | Tốc độ | CV | Mô tả |
|---|---|---|---|
| badusb_fast | 80–120 k/s | 0.02–0.05 | BadUSB tốc độ cao, rất đều |
| badusb_medium | 30–50 k/s | 0.05–0.10 | BadUSB tốc độ trung bình |
| script | 20–40 k/s | 0.08–0.15 | Script automation |
| rubber_ducky | 50–100 k/s | 0.03–0.08 | USB Rubber Ducky pattern |

## Trích xuất đặc trưng (Feature Extraction)

### Quy trình ghép cặp phím

Hệ thống ghép mỗi lần "nhấn xuống" (key_down) với lần "thả ra" (key_up) tương ứng để tính Hold Time, sau đó tính Flight Time giữa các cặp liên tiếp.

### Keystroke Timing

Bảng 3.5. Các đặc trưng Hold Time

| Feature | Ý nghĩa | Người thật | BadUSB |
|---|---|---|---|
| mean_hold_time | Trung bình Hold Time | 80–150ms | 5–15ms |
| std_hold_time | Độ lệch chuẩn | 20–50ms | 1–3ms |
| median_hold_time | Giá trị giữa | 75–140ms | 5–15ms |
| iqr_hold_time | Khoảng tứ phân vị | 15–60ms | 1–5ms |

Bảng 3.6. Các đặc trưng Flight Time

| Feature | Ý nghĩa | Người thật | BadUSB |
|---|---|---|---|
| mean_flight_time | Trung bình | 100–250ms | 5–25ms |
| std_flight_time | Độ lệch chuẩn | 40–120ms | 0.5–3ms |
| median_flight_time | Giá trị giữa | 90–200ms | 5–25ms |
| iqr_flight_time | Dao động | 30–100ms | 1–5ms |
| p5_flight_time | Percentile 5% | 50–80ms | 3–20ms |
| p95_flight_time | Percentile 95% | 300–800ms | 25–35ms |
| min_flight_time | Nhỏ nhất | 30–60ms | 1–5ms |
| cv_flight_time | Hệ số biến thiên | 0.3–0.8 | 0.02–0.10 |

Bảng 3.7. Các đặc trưng hành vi

| Feature | Ý nghĩa | Người thật | BadUSB |
|---|---|---|---|
| typing_speed | Tốc độ gõ (phím/giây) | 3–8 | 20–200 |
| modifier_ratio | Tỉ lệ phím Ctrl/Alt/Shift/Win | 2–10% | 15–50% |
| special_ratio | Tỉ lệ phím Esc/Tab/Enter | 1–5% | 10–30% |
| max_burst_length | Chuỗi gõ siêu nhanh liên tục | 0–5 | 15–40+ |

**CV (Coefficient of Variation)** là feature quan trọng nhất: CV cao → nhịp gõ hỗn loạn → người thật. CV thấp → nhịp đều như metronome → rất có thể là máy.

### Cửa sổ trượt (Sliding Window)

- **Kích thước**: 40 phím/cửa sổ
- **Bước trượt**: 20 phím
- Mỗi cửa sổ → 1 feature vector (16 features) → detector

## Mô hình phát hiện

### Rule-based Detection

Bảng 3.8. Bảy luật phát hiện dựa trên ngưỡng cố định

| # | Luật | Ngưỡng | Điểm cộng | Giải thích |
|---|---|---|---|---|
| 1 | Flight time quá nhanh | mean < 30ms | +0.30 | Người không thể gõ nhanh đến mức này |
| 2 | Nhịp gõ quá đều | CV < 0.15 | +0.25 | Người thật nhịp gõ lung tung |
| 3 | Tốc độ siêu nhanh | speed > 15 k/s | +0.20–0.35 | 15 k/s là giới hạn con người |
| 4 | Burst dài | >= 15 phím < 50ms | +0.20 | Người không thể gõ 15 phím liên tục nhanh |
| 5 | Hold time quá đều | IQR < 5ms | +0.15 | Giữ đều như robot |
| 6 | Nhiều phím modifier | ratio > 40% | +0.10 | Gõ bình thường chỉ ~5% modifier |
| 7 | Flight time cực nhỏ | min < 5ms | +0.10 | 5ms = không thể là người |

Bảng 3.9. Phân mức rủi ro

| Mức | Điểm | Ý nghĩa |
|---|---|---|
| NORMAL | 0 – 0.1 | Bình thường |
| LOW | 0.1 – 0.3 | Hơi lạ nhưng chưa chắc tấn công |
| MEDIUM | 0.3 – 0.6 | Đáng ngờ, cần theo dõi |
| HIGH | 0.6 – 0.8 | Rất có thể là tấn công |
| CRITICAL | 0.8 – 1.0 | Gần chắc chắn là tấn công |

### ML-based Detection

Bảng 3.10. Ba mô hình học máy

| Mô hình | Loại | Cách hoạt động |
|---|---|---|
| Isolation Forest | Unsupervised | Tìm điểm "lạc đàn" — injection bất thường dễ bị tách ra |
| One-Class SVM | Semi-supervised | Học vùng "bình thường" từ dữ liệu người thật |
| Random Forest | Supervised | Phân loại trực tiếp human vs injection |

### Hybrid Detection

Kết hợp Rule + ML: FinalScore = 0.6 × Rule_Score + 0.4 × ML_Score. Rule bắt nhanh các trường hợp rõ ràng, ML bắt các trường hợp tinh vi hơn.

## Cơ chế phản ứng (Response Engine)

Bảng 3.11. Cơ chế phản ứng theo mức rủi ro

| Mức rủi ro | Hành động | Giải thích |
|---|---|---|
| NORMAL | Allow — Cho qua | Không làm gì |
| LOW | LogOnly — Ghi log | Ghi lại để theo dõi |
| MEDIUM | Alert — Cảnh báo | Hiện thông báo đáng ngờ |
| HIGH | SoftBlock — Chặn mềm | Dừng nhận phím tạm thời (2 giây) |
| CRITICAL | Challenge — Xác minh | Hiện chuỗi 3 ký tự ngẫu nhiên, yêu cầu gõ lại |

**Cơ chế Challenge:** Khi phát hiện CRITICAL, hệ thống tạo chuỗi 3 ký tự ngẫu nhiên (ví dụ: A7K). BadUSB không thể thấy chuỗi trên màn hình → không thể gõ đúng → bị chặn.

**Cooldown:** Đợi ít nhất 5 giây giữa các lần cảnh báo, tránh spam.

**Log hệ thống:** Mọi detection event đều được ghi log CSV với timestamp, risk score, action, chi tiết rule vi phạm.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# CHƯƠNG 4: THỰC NGHIỆM MINH HỌA

## Môi trường thử nghiệm

### Phần cứng và phần mềm

Bảng 4.1. Cấu hình thực nghiệm

| Thành phần | Thông số |
|---|---|
| OS | Windows 10/11 |
| Rust | Stable (latest) |
| Python | 3.10+ |
| scikit-learn | 1.x |
| Streamlit | 1.x |

### Cấu hình Detection

```text
window_size       = 40         (40 phím mỗi cửa sổ)
slide_step        = 20         (trượt 20 phím)
ft_threshold      = 30ms       (Flight Time ngưỡng)
cv_threshold      = 0.15       (CV ngưỡng)
speed_threshold   = 15 k/s     (Tốc độ ngưỡng)
burst_threshold   = 15         (Burst ngưỡng)
```

## Dataset

### Tổng quan

Bảng 4.2. Thống kê Dataset

| Thuộc tính | Giá trị |
|---|---|
| Tổng số mẫu | 21,035 feature vectors |
| Mẫu human | 20,803 (98.9%) |
| Mẫu injection | 232 (1.1%) |
| Số features | 16 đặc trưng chính |
| Số nguồn dữ liệu | 3 nguồn |

### Chi tiết từng nguồn

Bảng 4.3. Chi tiết dataset

| Nguồn | Loại | Số lượng | Tỉ lệ |
|---|---|---|---|
| CMU Benchmark (51 users) | Human | 20,400 | 97.0% |
| Demo synthetic (5 profiles) | Human | ~403 | 1.9% |
| Injection mô phỏng (4 loại) | Injection | 232 | 1.1% |
| **Tổng** | | **21,035** | **100%** |

### Cách thu thập

- **CMU**: File DSL-StrongPasswordData.csv (4.6 MB), 51 người gõ password ".tie5Roanl" 400 lần, chuyển đổi bằng integrate_datasets.py, tạo ra 20,400 feature vectors.
- **Demo synthetic**: 5 typing profiles (slow, average, fast, touch, hunt_peck) với mô phỏng realistic.
- **Injection**: 4 profiles (badusb_fast, badusb_medium, script, rubber_ducky) tạo bằng generate_demo_data.py.

## Kịch bản test

### Người thật gõ bình thường

Gõ đoạn văn, chuỗi ngẫu nhiên, gõ tự do. Kỳ vọng: Risk NORMAL, không cảnh báo.

### Người thật gõ rất nhanh

Người gõ 10 ngón chuyên nghiệp, tốc độ cao. Kỳ vọng: Vẫn NORMAL (CV vẫn cao, vì người thật không thể gõ đều).

### Tấn công (Script tự động)

4 loại injection mô phỏng với các tốc độ và pattern khác nhau. Kỳ vọng: Risk CRITICAL, phát hiện tấn công.

## Triển khai mô hình

### Training

- **Train/Test split**: 80/20 (stratified).
- **Scaler**: StandardScaler (mean=0, std=1).
- **Contamination** (IF, OCSVM): 0.10.
- **Tổng samples**: 21,035.

### Kết quả so sánh 5 phương pháp

Bảng 4.4. Kết quả đánh giá

| Phương pháp | Accuracy | Precision | Recall | F1-Score | AUC-ROC |
|---|---|---|---|---|---|
| Rule-based | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Isolation Forest | 0.9103 | 0.1095 | 1.0000 | 0.1974 | 0.9954 |
| One-Class SVM | 0.9002 | 0.0995 | 1.0000 | 0.1810 | 0.9975 |
| **Random Forest** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** |
| Hybrid (R:0.6, ML:0.4) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

Best model: Random Forest — Accuracy 100%, F1 100%, AUC-ROC 1.000.

### Confusion Matrix

**Rule-based & Random Forest:**

Bảng 4.5. Confusion Matrix (Rule-based & Random Forest)

| | Predicted Human | Predicted Injection |
|---|---|---|
| Actual Human | 20,803 | 0 |
| Actual Injection | 0 | 232 |

Zero False Positives, Zero False Negatives.

Isolation Forest: FP = 1,887 (9.1%) — Recall 100% nhưng quá nhiều báo nhầm.

One-Class SVM: FP = 2,099 (10.1%) — False Positive cao nhất.

### Latency

Bảng 4.6. So sánh latency

| Phương pháp | Latency/sample |
|---|---|
| Random Forest | 0.012 ms |
| Isolation Forest | 0.013 ms |
| One-Class SVM | 0.476 ms |

Tất cả đáp ứng yêu cầu real-time (< 1ms/sample).

### Demo kết quả

**Demo 1 — Human Typing → NORMAL:**

```text
╔══════════════════════════════════════════════════╗
║  KDS Guard v0.1.0                                ║
║  Mode: Detection Active                          ║
╚══════════════════════════════════════════════════╝

[DEBUG] Features: speed=7.2 k/s, CV=0.452, burst=0
→ Kết quả: Risk NORMAL
```

**Demo 2 — BadUSB Attack → CRITICAL:**

```text
╔══════════════════════════════════════════════════╗
║  CẢNH BÁO - Risk Score: 0.95                    ║
╠══════════════════════════════════════════════════╣
║  • Flight time trung bình rất thấp: 8.5ms       ║
║  • Hệ số biến thiên CV rất thấp: 0.035          ║
║  • Tốc độ gõ bất thường: 47.2 keys/s            ║
║  • Burst pattern detected: 42 phím liên tiếp    ║
║  • Hold time rất đều (IQR: 1.50ms)              ║
╚══════════════════════════════════════════════════╝
→ PHÁT HIỆN TẤN CÔNG HID INJECTION!
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# CHƯƠNG 5: KẾT LUẬN VÀ ĐÁNH GIÁ

## Kết quả đạt được

### Accuracy

- **Rule-based**: Accuracy 100%, F1-Score 1.0
- **Random Forest**: Accuracy 100%, F1-Score 1.0, AUC-ROC 1.000
- **Hybrid**: Accuracy 100%, F1-Score 1.0
- **Isolation Forest**: AUC-ROC 0.995 (Recall 100%)
- **One-Class SVM**: AUC-ROC 0.997 (Recall 100%)

### False Positive

- Rule-based, Random Forest, Hybrid: **Zero False Positives** (0 báo nhầm trên 20,803 mẫu human).
- Isolation Forest: FP = 1,887 (9.1%).
- One-Class SVM: FP = 2,099 (10.1%).

### Latency

- Random Forest: **0.012 ms/sample** — nhanh nhất.
- Tất cả đều đáp ứng yêu cầu **real-time** (< 1ms).

## Phân tích

### Khi nào hệ thống hoạt động tốt

- BadUSB tốc độ cao (> 15 k/s), nhịp đều (CV < 0.15): phát hiện ngay lập tức.
- Script injection, macro typing tốc độ trung bình: phát hiện tốt nhờ CV và burst pattern.

### Khi nào hệ thống có thể fail

- Attacker mô phỏng timing giống người: thêm random jitter vào delay → CV tăng → có thể bypass.
- Người dùng macro hợp lệ: Password manager auto-fill, text expander → bị báo nhầm.
- Người thay đổi nhịp gõ: Mệt, stress, đổi bàn phím → drift dẫn đến false positive.

### Attack nào khó phát hiện

BadUSB cố tình chạy chậm (< 15 k/s) và thêm random jitter lớn. Giải pháp: Hybrid Detection (ML bắt pattern tinh vi hơn) + User-adaptive baseline.

## So sánh Rule-based vs ML

Bảng 5.1. So sánh các phương pháp

| Tiêu chí | Rule-based | ML (Random Forest) | Hybrid |
|---|---|---|---|
| Accuracy | 100% | 100% | 100% |
| Tốc độ triển khai | Nhanh | Cần dataset để train | Trung bình |
| Khả năng adapt | Thấp | Cao | Cao nhất |
| Chống bypass | Trung bình | Cao | Cao nhất |
| Giải thích kết quả | Rõ ràng | Khó hơn | Kết hợp |

## Hạn chế

1. **Dữ liệu injection mô phỏng**: Chưa sử dụng thiết bị BadUSB vật lý.
2. **Dataset imbalanced**: Injection chỉ chiếm 1.1% (232/21,035).
3. **Chưa thử attack tinh vi**: Attacker mô phỏng timing giống người thật có thể qua mặt.
4. **False Positive tiềm ẩn**: Người dùng macro, password manager có thể bị báo nhầm.
5. **Chỉ hỗ trợ Windows**: Chưa port sang Linux/macOS.
6. **Chưa có GUI**: Chỉ hoạt động qua console.
7. **Soft Block giới hạn**: Chưa thực sự drop keystroke events (cần kernel-level driver).

## Hướng phát triển

### Ngắn hạn

- Thu thập thêm dữ liệu người thật (100+ người).
- Test với thiết bị BadUSB thật (USB Rubber Ducky, DigiSpark).
- Phát triển GUI: system tray icon, toast notification.
- User-adaptive baselining.

### Deep Learning

- Thử nghiệm LSTM/Transformer trên chuỗi keystroke raw.
- Autoencoder cho anomaly detection không cần dữ liệu injection.

### Real-time System

- Kernel-level driver: block keystrokes thực sự.
- Zero-Trust USB: chỉ cho phép HID từ trusted devices.
- Device Fingerprinting kết hợp phân tích timing với USB descriptor.
- Integration với EDR: xuất alert sang SIEM/Windows Event Log.
- Cross-platform: Port sang Linux và macOS.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# TÀI LIỆU THAM KHẢO {.unnumbered}

[1] Bkav, "Tổng kết an ninh mạng năm 2023 và dự báo năm 2024", <https://www.bkav.com/tieu-diem/-/view-content/1888081/tong-ket-an-ninh-mang-nam-2023-va-du-bao-nam-2024>

[2] BCaVN, "Thị trường máy tính hãng nào có doanh số đứng đầu thế giới", <https://bcavn.com/tin-thi-truong/thi-truong-may-tinh-hang-nao-co-doanh-so-dung-dau-the-gioi-30991.html>

[3] MITRE ATT&CK, "T1674 — USB/Removable Media", <https://attack.mitre.org/techniques/T1674/>

[4] Công Thương, "Thị trường máy tính", <https://congthuong.vn/thi-truong-may-tinh-hang-nao-co-doanh-so-dung-dau-the-gioi-370620.html>

[5] The Rust Programming Language, <https://rust-lang.org/>

[6] AWS, "Why AWS is the Best Place to Run Rust", <https://aws.amazon.com/vi/blogs/devops/why-aws-is-the-best-place-to-run-rust/>

[7] Microsoft, "70 percent of all security bugs are memory safety issues", ZDNet 2019, <https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/>

[8] Quora, "What are the advantages of using RUST over other languages", <https://www.quora.com/What-are-the-advantages-of-using-RUST-over-other-languages-like-C-Perl-and-Python>

[9] Hak5, "USB Rubber Ducky", YouTube, <https://www.youtube.com/watch?v=_ysUxOKyGGU>

[10] S. Zhao, X.A. Wang, "Khảo sát về các thiết bị HID độc hại", Hội nghị quốc tế về băng thông rộng và không dây, Springer, 2019.

[11] G. Tzokatziou, L. Maglaras, H. Janicke, "Thiết kế không an toàn: Sử dụng các thiết bị giao diện người dùng để khai thác hệ thống SCADA", Hội thảo về ICS, 2015.

[12] M. Nicho, I. Sabry, "Mô hình hóa mối đe dọa và lỗ hổng của các thiết bị giao diện người dùng độc hại", Kỷ yếu Khoa học và Công nghệ Âu Á, 2022.

[13] A. Ghosh, A. Mitra, S.S. Chakkaravarathy, "SAILA: Bảo vệ chống tấn công xâm nhập thiết bị giao diện người dùng (HID)", IEEE lần thứ 44, 2024.

[14] CMU Keystroke Dynamics Benchmark Dataset, K. Killourhy, R. Maxion, Carnegie Mellon University, <https://www.cs.cmu.edu/~keystroke/>

[15] scikit-learn Documentation, "Unsupervised Anomaly Detection", <https://scikit-learn.org/stable/modules/outlier_detection.html>

[16] Streamlit Documentation, <https://docs.streamlit.io/>

[17] F. Monrose, A. D. Rubin, "Keystroke dynamics as a biometric for authentication," Future Generation Computer Systems, vol. 13, no. 4-5, pp. 351-359, 1997. <https://doi.org/10.1016/S0167-739X(97)00019-4>

[18] K. S. Killourhy, R. A. Maxion, "Comparing anomaly-detection algorithms for keystroke dynamics," 2009 IEEE/IFIP International Conference on Dependable Systems & Networks, Estoril, Portugal, 2009. <https://doi.org/10.1109/DSN.2009.5270346>

[19] M. Neuner et al., "Enter the Matrix: Keystroke Dynamics for Anti-Spoofing and Continuous Authentication," IEEE Transactions on Information Forensics and Security, 2018. <https://ieeexplore.ieee.org/document/8353149>

[20] J. Tian et al., "A Comprehensive Survey on HID Attacks and Defense Strategies," IEEE Access, 2019.

[21] W. Meng, et al., "Surveying the Development of Biometric User Authentication on Mobile Phones," IEEE Communications Surveys & Tutorials, 2015.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# PHỤ LỤC {.unnumbered}

## Phụ lục A: Cấu trúc dự án {.unnumbered}

```text
DOANCOSO/
├── kds_guard/                      # RUST PROJECT — Core System
│   └── src/
│       ├── main.rs                 # Entry point + pipeline
│       ├── input_capture.rs        # Thu thập sự kiện bàn phím
│       ├── logger.rs               # Ghi log CSV ẩn danh
│       ├── feature.rs              # Trích xuất 16 đặc trưng
│       ├── detector.rs             # Rule-based detection 7 rules
│       └── policy.rs               # Response engine 5 actions
│
├── scripts/                        # PYTHON SCRIPTS — ML & Analysis
│   ├── train_model.py              # Huấn luyện IF/OCSVM/RF
│   ├── evaluate.py                 # Đánh giá Rule vs ML vs Hybrid
│   ├── visualize.py                # 6 loại biểu đồ phân tích
│   ├── integrate_datasets.py       # Tích hợp 3 nguồn dataset
│   ├── generate_demo_data.py       # Tạo dataset demo
│   ├── feature_extraction.py       # Tính features từ raw CSV
│   ├── collect_keystrokes.py       # Python collector (pynput)
│   └── simulate_injection.py       # Mô phỏng injection cho demo
│
├── dashboard/                      # STREAMLIT DASHBOARD
│   └── dashboard.py                # 5 tabs dashboard
│
├── data/                           # Dataset
│   ├── features_dataset.csv        # Dataset chính (21,035 rows)
│   ├── features_cmu.csv            # CMU vectors (20,400 rows)
│   └── raw/                        # Raw data
│
├── models/                         # ML Models
│   ├── isolation_forest.pkl
│   ├── oneclass_svm.pkl
│   ├── random_forest.pkl
│   └── scaler.pkl
│
└── plots/                          # 6 biểu đồ phân tích
```

## Phụ lục B: Thống kê dự án {.unnumbered}

Bảng B.1. Thống kê tổng hợp

| Metric | Giá trị |
|---|---|
| Tổng file source code | 17 files |
| Rust modules | 6 files (51.7 KB) |
| Python scripts | 11 files (153.0 KB) |
| Dataset chính | 21,035 samples |
| ML models trained | 3 (IF + OCSVM + RF) |
| Best model accuracy | 100% (Random Forest) |
| Best model AUC-ROC | 1.000 (Random Forest) |

## Phụ lục C: Hướng dẫn chạy hệ thống {.unnumbered}

### Cài đặt {.unnumbered}

```bash
# Python dependencies
pip install -r requirements.txt

# Build Rust
cd kds_guard && cargo build --release
```

### Chạy pipeline {.unnumbered}

```bash
# Tạo demo data → Train → Evaluate → Visualize
run_pipeline.bat

# Hoặc từng bước
python scripts/generate_demo_data.py
python scripts/train_model.py
python scripts/evaluate.py
python scripts/visualize.py
streamlit run dashboard/dashboard.py
```

### Chạy KDS Guard {.unnumbered}

```bash
# Thu thập dữ liệu
kds_guard.exe --collect-only --log-keys -v

# Phát hiện tấn công
kds_guard.exe --log-keys -v

# Demo (giới hạn 30 giây)
kds_guard.exe --log-keys -v -d 30
```
