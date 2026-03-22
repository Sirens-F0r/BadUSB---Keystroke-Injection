Dưới đây là một bản triển khai chi tiết (theo hướng phòng thủ/giám sát) cho đề tài: Phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB) bằng phân tích dữ liệu động học gõ phím (Keystroke Dynamics) dựa trên dữ liệu thực nghiệm.

⸻

1) Mục tiêu và phạm vi

Mục tiêu chính
 1. Phát hiện hành vi “gõ phím không giống người” (tốc độ/nhịp điệu bất thường) đến từ thiết bị HID (keyboard) giả mạo hoặc bộ tiêm phím.
 2. Cảnh báo & giảm thiểu theo chính sách: cảnh báo, chặn chuỗi phím, khóa nhập liệu tạm thời, hoặc vô hiệu hóa/khóa thiết bị HID (mức này tùy OS/quyền).
 3. Xây dựng bộ dữ liệu thực nghiệm (50–100 người) và mô hình/luật quyết định có thể tái lập.

Phạm vi hợp lý cho đồ án
 • Tập trung vào HID keyboard injection (đầu vào dạng key events).
 • Làm “near-real-time” trên máy người dùng: ước lượng trong cửa sổ 1–3 giây hoặc 20–60 phím.
 • Chặn theo mức rủi ro (risk score) thay vì chặn cứng mọi thứ.

⸻

2) Threat model (mô hình đe dọa)

Đối thủ: thiết bị/firmware giả mạo tự nhận là keyboard HID và gửi các phím với tốc độ/nhịp rất đều, rất nhanh, ít sai, có mẫu thời gian “máy”.

Giả định:
 • Bạn không dựa vào chữ ký mã độc/AV.
 • Bạn không cần biết nội dung người dùng đang gõ; chỉ cần timing/nhịp.
 • Không cố “đánh bại” kẻ tấn công tinh vi mô phỏng timing hoàn hảo; mục tiêu là chặn phần lớn BadUSB phổ biến và tạo tầng phòng thủ bổ sung.

⸻

3) Kiến trúc hệ thống (đề xuất)

3.1 Luồng xử lý tổng thể
 1. Collector (thu thập): bắt sự kiện bàn phím ở mức OS (timestamp + key down/up + device id nếu lấy được).
 2. Feature Extractor (trích đặc trưng): tính các đặc trưng thời gian theo cửa sổ.
 3. Detector (phát hiện): kết hợp “rule-based” + ML (tuỳ mức).
 4. Response Engine (phản ứng): cảnh báo / chặn / khóa thiết bị (policy).
 5. Telemetry & Dataset Manager: lưu dữ liệu đã ẩn danh + nhãn, phục vụ huấn luyện/đánh giá.

3.2 Các mức triển khai (khuyến nghị theo đồ án)
 • MVP (đạt điểm chắc): Collector + Feature + Rule-based + UI cảnh báo + logging dataset.
 • Nâng cao: thêm mô hình học máy (One-Class / Binary) + policy tự thích nghi theo người dùng.
 • Rất nâng cao: nhận diện theo device fingerprint + tích hợp EDR/driver-level.

⸻

4) Thu thập dữ liệu thực nghiệm (50–100 người)

4.1 Thiết kế dữ liệu

Bạn cần tối thiểu 2 lớp:
 • Benign (người thật): nhiều người, nhiều phiên, nhiều ngữ cảnh.
• Synthetic/Injected (tiêm phím): tạo dữ liệu “máy” để mô phỏng các mẫu injection phổ biến (tốc độ cao, đều, không có “micro-variance”).
Lưu ý an toàn: chỉ tạo dữ liệu timing mô phỏng, không mô tả cách tấn công.

4.2 Kịch bản gõ (để dữ liệu đa dạng)

Mỗi người 2–3 phiên (mỗi phiên 3–5 phút), gồm:
 1. Gõ đoạn văn tiếng Việt có dấu (copy text hiển thị để gõ lại).
 2. Gõ mật khẩu giả lập / chuỗi ký tự ngẫu nhiên (để có pattern khó).
 3. Gõ tự do (free typing) 1–2 phút.

Ghi lại metadata không nhạy cảm:
 • loại bàn phím (laptop/mech), layout, hệ điều hành, thời điểm (sáng/tối), mức quen gõ 10-ngón (tự đánh giá).

4.3 Quyền riêng tư & đạo đức (rất nên ghi vào báo cáo)
 • Không lưu nội dung phím (hoặc nếu cần thì chỉ lưu “lớp ký tự”: chữ/số/ký tự đặc biệt, không lưu nguyên văn).
 • Hash/ẩn danh participant ID.
 • Cho người tham gia consent, quyền rút dữ liệu.

⸻

5) Đặc trưng (features) trọng tâm từ Keystroke Dynamics

Bạn đã nêu 2 chỉ số “cốt lõi”, triển khai như sau:

5.1 Hold Time (Dwell time)
 • HT = time(key_up) - time(key_down) cho từng phím.
 • Thống kê theo cửa sổ: median, mean, std, IQR, percentiles (p10/p50/p90).

5.2 Flight Time (Inter-key time)

Có vài biến thể, chọn 1–2 loại nhất quán:
 • Down–Down (DD): FT_DD = down(i+1) - down(i)
 • Up–Down (UD): FT_UD = down(i+1) - up(i) (thường “mượt” hơn với gõ liên tục)

Thống kê tương tự: median/std/IQR/skewness.

5.3 Đặc trưng “máy thường lộ”

Để bắt BadUSB tốt hơn, thêm các feature “đều như metronome”:
 • Độ đều (regularity): coefficient of variation CV = std/mean của FT. Injection hay có CV thấp bất thường.
 • Tốc độ cực đại: p1/p5 của FT rất nhỏ liên tục (chuỗi phím siêu nhanh).
 • Burst pattern: chuỗi dài N phím trong thời gian rất ngắn (ví dụ 40 phím < 1s).
 • Tỉ lệ phím đặc biệt: ESC/Win/Ctrl/Alt/Enter/Tab xuất hiện dày đặc trong thời gian ngắn (không khẳng định tấn công, nhưng cộng điểm rủi ro).
 • Tỉ lệ backspace/sai: người thật thường có lỗi; injection thường “sạch” quá mức (cẩn thận: không phải lúc nào cũng đúng).

5.4 Cửa sổ (windowing)
 • Sliding window: 30–80 key events hoặc 1–3 giây.
 • Xuất ra một “feature vector” mỗi cửa sổ → detector cho điểm.

⸻

6) Phát hiện (Detection) – lộ trình 3 tầng

Tầng A: Rule-based (dễ làm, hiệu quả ngay)

Thiết kế “risk score”:

Ví dụ (minh họa logic):
 • Nếu median(FT_DD) < X và CV(FT_DD) < Y trong ≥ K phím → +rủi ro lớn
• Nếu chuỗi ≥ N phím trong < T giây → +rủi ro
 • Nếu xuất hiện nhiều phím modifier/special trong burst → +rủi ro
 • Nếu HT/FT quá “đẹp” (IQR cực thấp) trong thời gian dài → +rủi ro

Cuối cùng:
 • Risk < 0.4: cho qua
 • 0.4–0.7: cảnh báo mềm + log
 • 0.7: chặn/khóa nhập liệu tạm thời, yêu cầu xác minh

Ưu điểm: không cần nhãn injection phức tạp, demo dễ.
Nhược: dễ bị né nếu đối thủ mô phỏng timing “người”.

Tầng B: One-class anomaly detection (hợp với dữ liệu thật)

Huấn luyện mô hình “bình thường” từ dữ liệu người thật:
 • One-Class SVM, Isolation Forest, hoặc Autoencoder (nếu bạn muốn deep).
 • Đầu ra: anomaly score theo cửa sổ.

Ưu điểm: không cần “dữ liệu tấn công thật” nhiều.
Nhược: cần chuẩn hóa theo người/thiết bị; dễ false positive nếu user thay đổi nhịp gõ.

Tầng C: Hybrid (khuyến nghị)
 • Rule-based để bắt “tiêm phím thô” ngay lập tức.
 • One-class để phát hiện kiểu lạ hơn.
 • Kết hợp score: FinalScore = a*Rule + b*Anomaly.

⸻

7) Ngăn chặn (Mitigation) theo chính sách

Bạn có nhiều mức “an toàn triển khai”:

Mức 1: Cảnh báo + ghi log
 • Pop-up: “Phát hiện tốc độ gõ bất thường từ thiết bị X, bạn có đang dùng macro/auto-type không?”
 • Ghi log window score, device id.

Mức 2: Chặn chuỗi nhập liệu tạm thời (soft block)
 • Khi score cao: “drop” key events trong 1–2 giây.
 • Yêu cầu xác minh: nhấn tổ hợp ngẫu nhiên hiển thị trên màn hình (human-in-the-loop).

Mức 3: Khóa thiết bị HID (hard block, tùy OS/quyền)
 • Trên một số hệ điều hành, muốn “ngắt kết nối” HID thường cần quyền admin/driver-level.
 • Trong đồ án, bạn có thể mô tả như “policy tùy chọn”, demo bằng soft block + cảnh báo là ổn.

⸻

8) Triển khai bằng Rust: chia module rõ ràng

8.1 Các module
 1. input_capture
 • bắt key down/up
 • timestamp độ phân giải cao (monotonic clock)
 • lấy device info nếu API OS cho phép
 2. feature
 • buffer events
 • windowing + compute feature vector
 3. detector
 • rules engine
 • model inference (nếu ML)
 • score calibration
 4. policy
 • mapping score → action
 • rate limit cảnh báo, tránh spam
 5. storage
 • ghi dataset (CSV/Parquet), config, model
 6. ui
 • tray icon / notification / dashboard đơn giản

8.2 Định dạng dữ liệu (gợi ý)
 • Event log (ẩn danh):
 • t_down, t_up, key_class, is_modifier, device_id_hash
 • Feature log:
 • window_start, window_end, features..., label(optional), user_id_hash

⸻

9) Đánh giá và thí nghiệm

9.1 Metrics
• Precision/Recall/F1 cho lớp injected (với dữ liệu mô phỏng hoặc controlled test).
 • False Positive Rate trên người thật.
 • Latency: thời gian từ lúc xảy ra đến lúc cảnh báo/chặn.
 • Overhead CPU/RAM.

9.2 Kịch bản test
 • Người thật gõ bình thường.
 • Người thật gõ rất nhanh (để xem false positive).
 • Dữ liệu injected mô phỏng nhiều mức: “siêu đều”, “hơi jitter”, “tốc độ vừa”.

9.3 Báo cáo kết quả
 • ROC/PR curve theo threshold.
 • So sánh: Rule-only vs ML-only vs Hybrid.
 • Phân tích lỗi: vì sao FP/FN xảy ra.

⸻

10) Những rủi ro/giới hạn cần nêu trong báo cáo
 • Người dùng có thể dùng macro/autotype hợp lệ (password manager auto-fill) → dễ bị báo nhầm. Cần whitelist theo ứng dụng hoặc chế độ “trusted action”.
 • Người dùng thay đổi nhịp gõ khi mệt, stress, hoặc đổi bàn phím → drift.
 • Đối thủ tinh vi có thể mô phỏng timing giống người → hệ thống chỉ là 1 lớp phòng thủ, nên kết hợp thêm:
 • Device allowlist
 • USB device history
 • “New keyboard” prompt & user confirmation
 • Chính sách hạn chế HID mới trên máy doanh nghiệp

⸻

11) Kế hoạch làm (timeline gợi ý 8–10 tuần)
 1. Tuần 1–2: Collector + log dữ liệu + UI tối thiểu
 2. Tuần 3: Feature extraction + windowing + thống kê
 3. Tuần 4: Rule-based detector + risk score + demo
 4. Tuần 5–6: Thu thập dữ liệu người thật (song song)
 5. Tuần 7: One-class model + evaluate
 6. Tuần 8: Hybrid + policy chặn mềm + tối ưu hiệu năng
 7. Tuần 9–10: Viết báo cáo + ablation study + hoàn thiện demo

⸻

12) Deliverables (đầu ra đồ án)
 • Tool Rust chạy nền (service/tray) + config.
 • Bộ dataset (ẩn danh) + script phân tích.
 • Báo cáo: threat model, dataset protocol, feature, mô hình, kết quả, giới hạn.
 • Demo video: gõ người vs “tiêm phím mô phỏng” → hệ thống cảnh báo/chặn.

[1] https://www.bkav.com/tieu-diem/-/view-content/1888081/tong-ket-an-ninh-mang-nam-2023-va-du-bao-nam-2024 
[2] https://bcavn.com/tin-thi-truong/thi-truong-may-tinh-hang-nao-co-doanh-so-dung-dau-the-gioi-30991.html 
[3] https://attack.mitre.org/techniques/T1674/ 
[4] https://congthuong.vn/thi-truong-may-tinh-hang-nao-co-doanh-so-dung-dau-the-gioi-370620.html 
[5] https://rust-lang.org/ 
[6] https://aws.amazon.com/vi/blogs/devops/why-aws-is-the-best-place-to-run-rust/ 
[7] https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/ 
[8] https://www.quora.com/What-are-the-advantages-of-using-RUST-over-other-languages-like-C-Perl-and-Python-in-terms-of-performance-and-stability-Why-is-RUST-not-widely-used-by-everyone-yet 
[9] https://www.youtube.com/watch?v=_ysUxOKyGGU 
[10] S Zhao, XA Wang. "Khảo sát về các thiết bị HID độc hại". Hội nghị quốc tế về băng thông rộng và không dây... Springer (2019).
[11] G Tzokatziou, L Maglaras, Helge Janicke "Thiết kế không an toàn: Sử dụng các thiết bị giao diện người dùng để khai thác hệ thống SCADA". Hội thảo về ICS (2015). 
[12] M Nicho, I Sabry. "Mô hình hóa mối đe dọa và lỗ hổng của các thiết bị giao diện người dùng độc hại". Kỷ yếu Khoa học và Công nghệ Âu Á (2022).
[13] A Ghosh, A Mitra, SS Chakkaravarathy. "Saila: Bảo vệ chống tấn công xâm nhập thiết bị giao diện người dùng (HID)...". IEEE lần thứ 44 (2024). 