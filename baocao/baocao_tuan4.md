# Kịch bản báo cáo tiến độ — Tuần 4

**Thời lượng:** ~5 phút
**Ngữ cảnh:** Báo cáo qua link, chiều thứ 7, 2h

---

## Mở đầu (~30 giây)

> Dạ em chào thầy. Em xin báo cáo tiến độ đồ án tuần 4 ạ.
>
> Đề tài của em là **"Phát hiện và ngăn chặn tấn công chèn phím giả mạo BadUSB bằng phân tích động học gõ phím"**.
>
> Tuần này em tập trung vào 2 việc chính: một là **hoàn thiện nội dung chương 1 và chương 2** của báo cáo, hai là **rà soát lại toàn bộ hệ thống** xem còn thiếu gì khi đưa ra dùng thật.

---

## Phần 1: Tình hình viết báo cáo (~1 phút 30 giây)

> **Về chương 1 — Tổng quan**, em đã viết xong phần nêu vấn đề, lý do chọn đề tài, mục tiêu, và phạm vi. Nội dung chính là giải thích tại sao tấn công BadUSB nguy hiểm — vì nó giả mạo bàn phím USB nên antivirus không phát hiện được, sau đó nó tự gõ lệnh vào máy nạn nhân thay vì chứa file virus. Em cũng nêu hướng giải quyết là dùng phân tích cách gõ phím để phân biệt người thật và thiết bị giả.
>
> **Về chương 2 — Cơ sở lý thuyết**, em viết về các phần:
> - **Tấn công BadUSB** là gì, cơ chế hoạt động, tại sao nó bypass được bảo mật truyền thống
> - **Keystroke Dynamics** — cơ sở lý thuyết chính, gồm các đặc trưng như Hold Time (thời gian nhấn giữ phím), Flight Time (khoảng cách giữa 2 phím), rồi các chỉ số thống kê như trung bình, độ lệch chuẩn, CV,...
> - **Phương pháp phát hiện**: em trình bày 2 hướng — Rule-based (đặt ngưỡng cứng) và Machine Learning (Isolation Forest, SVM). Hiện tại hệ thống của em đang dùng Rule-based làm chính.
>
> Hai chương này em đã nộp lên elearning rồi ạ. Có một số chỗ em vẫn đang bổ sung thêm tài liệu tham khảo vì em tìm thêm được vài bài nghiên cứu liên quan.

---

## Phần 2: Tình hình hệ thống (~2 phút)

> **Về phần code**, em xin trình bày tiến trình từ đầu đến giờ:
>
> **Tuần 1-2**: Em xây dựng xong phần **thu thập dữ liệu**. Em viết bằng Rust, dùng thư viện rdev để bắt sự kiện bàn phím. Khi người dùng gõ phím, hệ thống ghi lại thời điểm nhấn, thời điểm thả, loại phím — nhưng **không lưu nội dung gõ** để bảo mật. Dữ liệu lưu ra file CSV. Em cũng viết thêm bản Python dùng pynput để cho bạn bè cài dễ hơn, vì không phải ai cũng build được Rust.
>
> **Tuần 3**: Em làm phần **trích xuất đặc trưng** và **phát hiện**. Hệ thống chia dữ liệu thành từng cửa sổ 40 phím, rồi tính 16 đặc trưng cho mỗi cửa sổ. Sau đó dùng 7 luật để chấm điểm rủi ro — ví dụ nếu tốc độ gõ quá nhanh, hoặc khoảng cách giữa các phím quá đều thì sẽ bị cộng điểm. Nếu điểm vượt ngưỡng thì cảnh báo.
>
> Em cũng huấn luyện thêm 3 mô hình ML là Isolation Forest, One-class SVM, và Random Forest trên bộ dữ liệu CMU Benchmark kết hợp dữ liệu mô phỏng. Kết quả F1-score khoảng 0.95 trên dữ liệu test, nhưng em lưu ý là **đây là dữ liệu mô phỏng**, chưa phải dữ liệu thật.
>
> **Tuần 4 (tuần này)**: Em tập trung **rà soát lại toàn bộ pipeline** để chuẩn bị cho giai đoạn thu thập dữ liệu thật. Em đã:
> - Kiểm tra lại flow từ thu thập → trích xuất → phát hiện → phản ứng, xác nhận là code chạy được đầy đủ
> - Đóng gói tool thu thập thành **bộ kit** gồm file exe + file bat + hướng dẫn, nén thành zip để gửi cho bạn bè
> - Dọn lại code: giảm bớt comment không cần thiết, sửa lại giao diện console cho gọn
> - Viết chương 1 và chương 2 của báo cáo

---

## Phần 3: Khó khăn và kế hoạch (~1 phút)

> **Khó khăn hiện tại** là em **chưa thu thập được nhiều dữ liệu người dùng thật**. Em đã cho vài bạn thử nhưng dữ liệu còn ít — mỗi lần chỉ gõ được khoảng 50-100 sự kiện, trong khi hệ thống yêu cầu tối thiểu 80 sự kiện mới đủ để trích xuất đặc trưng. Nên kết quả đánh giá hiện tại chủ yếu dựa trên dữ liệu mô phỏng và bộ CMU Benchmark.
>
> **Kế hoạch tuần tới**:
> - Phát bộ kit thu thập cho nhiều bạn hơn, mục tiêu 5-10 người, mỗi người 3 session
> - Sau khi có dữ liệu thật, chạy lại pipeline: tích hợp → retrain model → đánh giá lại
> - Bắt đầu viết **chương 3 — Phương pháp áp dụng**: gồm kiến trúc hệ thống, giải pháp rule-based, thuật toán ML
> - Và **chương 4 — Thực nghiệm**: demo phát hiện người thật vs BadUSB, bảng kết quả so sánh
>
> Em cũng đã soạn sẵn kịch bản demo 3 tình huống: người gõ bình thường (kỳ vọng hệ thống không báo), tấn công giả lập (kỳ vọng phát hiện), và dashboard hiển thị kết quả. Khi nào thầy cần em có thể demo được.

---

## Kết thúc (~15 giây)

> Tóm lại tuần này em tập trung vào viết báo cáo chương 1-2 và rà soát hệ thống. Phần code cơ bản đã xong, vấn đề chính bây giờ là thiếu dữ liệu thật để đánh giá chính xác hơn. Em sẽ tiếp tục thu thập và viết tiếp chương 3-4 trong tuần tới ạ.
>
> Dạ em xin hết ạ. Thầy có góp ý gì cho em không ạ?
