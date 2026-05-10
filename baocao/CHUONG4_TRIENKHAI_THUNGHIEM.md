# CHƯƠNG 4: TRIỂN KHAI MÔI TRƯỜNG THỬ NGHIỆM

## 4.1. Mục tiêu và cấu hình môi trường thử nghiệm

Mục tiêu chính của việc triển khai môi trường thử nghiệm là nhằm mô phỏng lại các điều kiện thực tế của một hệ thống người dùng cá nhân hoặc doanh nghiệp. Từ đó, tiến hành kiểm tra, đánh giá tính khả thi, hiệu năng cũng như độ chính xác của hệ thống **KDS Guard** trong việc thu thập, phân tích hành vi gõ phím và ngăn chặn kịp thời các cuộc tấn công nhúng mã độc qua thiết bị ngoại vi (BadUSB).

**Cấu hình môi trường thử nghiệm phần cứng và phần mềm:**
*   **Phần cứng:** 
    *   Máy tính cá nhân (PC/Laptop) đóng vai trò làm máy nạn nhân (Target Machine) sử dụng hệ điều hành Windows.
    *   Thiết bị giả lập BadUSB (như Digispark ATtiny85, Raspberry Pi Pico hoặc USB Rubber Ducky) dùng để thực hiện việc nhúng keystroke tự động.
*   **Phần mềm & Công cụ:**
    *   Hệ điều hành Windows 10/11 (Môi trường chính chạy KDS Guard Core bằng Rust).
    *   Python 3.10+ cùng các thư viện Machine Learning (Scikit-learn, Pandas, Numpy) phục vụ cho quá trình huấn luyện và đánh giá mô hình.
    *   Node.js và React/Vite cho giao diện Dashboard giám sát thời gian thực.

![Môi trường Thử nghiệm An toàn Không gian Mạng](C:\Users\LOQ\.gemini\antigravity\brain\80fb5419-da48-448e-9e29-aa7239bcd443\test_environment_setup_1777819659094.png)
*Hình 4.1: Cấu trúc mô phỏng hệ thống và môi trường thử nghiệm đánh giá hệ thống.*

---

## 4.2. Thiết lập môi trường thực nghiệm

### 4.2.1. Xây dựng các kịch bản kiểm thử

Để đảm bảo hệ thống có khả năng nhận diện một cách chính xác, chúng tôi đã xây dựng các kịch bản kiểm thử chia làm 2 pha chính:
1.  **Pha thu thập dữ liệu người dùng (Normal User Behavior):** Người dùng thực hiện các thao tác gõ phím thông thường như soạn thảo văn bản, lập trình, lướt web. Dữ liệu này giúp mô hình AI/Rule-based học được nhịp độ gõ phím bình thường (độ trễ giữa các phím thường > 30ms).
2.  **Pha giả lập tấn công BadUSB (Malicious Injection):** Các kịch bản tấn công được nạp vào vi điều khiển (BadUSB). Khi kết nối vào máy nạn nhân, thiết bị sẽ tự động mở Terminal (PowerShell/CMD) và thực thi các câu lệnh tải payload độc hại với tốc độ đánh máy siêu việt (< 10ms giữa mỗi phím) vượt ngoài giới hạn sinh học của con người.

![Kịch bản giả lập tấn công BadUSB](C:\Users\LOQ\.gemini\antigravity\brain\80fb5419-da48-448e-9e29-aa7239bcd443\badusb_attack_scenario_1777819677810.png)
*Hình 4.2: Kịch bản giả lập tấn công BadUSB thông qua thiết bị ngoại vi tự động nhập liệu.*

### 4.2.2. Quá trình huấn luyện mô hình bằng dữ liệu thu thập được

Quá trình huấn luyện (Training Process) được thực hiện dựa trên tập dữ liệu tổng hợp với tổng cộng **21,173** mẫu log sự kiện, trong đó bao gồm **20,941** hành vi gõ phím thông thường và **232** chuỗi hành vi tấn công (injection). 

Các mô hình được đem vào huấn luyện và thử nghiệm bao gồm:
*   **Rule-based Engine (Cơ chế dựa trên quy tắc):** Thiết lập ngưỡng cứng về thời gian gõ và tần suất, không yêu cầu huấn luyện sâu.
*   **Isolation Forest:** Phân tích điểm bất thường dựa trên cấu trúc cây phân lập (chuyên dùng cho Anomaly Detection).
*   **One-Class SVM:** Học biên giới của hành vi "bình thường" và coi mọi thứ nằm ngoài biên giới là BadUSB.
*   **Random Forest:** Mô hình học có giám sát dựa trên tập dữ liệu đã gán nhãn rõ ràng để phân loại nhị phân.
*   **Mô hình Hybrid (Kết hợp R:0.6, ML:0.4):** Kết hợp kết quả từ Rule-based và Random Forest để cho ra quyết định cuối cùng giúp giảm thiểu sai sót.

![Quá trình huấn luyện Machine Learning](C:\Users\LOQ\.gemini\antigravity\brain\80fb5419-da48-448e-9e29-aa7239bcd443\ml_training_process_1777819695991.png)
*Hình 4.3: Minh họa luồng dữ liệu và quá trình trích xuất đặc trưng để đưa vào huấn luyện mô hình học máy.*

### 4.2.3. Tích hợp và chạy thử nghiệm phần mềm bảo vệ

Sau khi mô hình được xuất ra dưới dạng các file `.pkl` (như `random_forest.pkl`, `isolation_forest.pkl`, `scaler.pkl`), hệ thống Python Backend được khởi chạy và đóng vai trò như một WebSocket Server (WS Bridge). Cùng lúc đó, Core giám sát bằng ngôn ngữ Rust được kích hoạt.
Quá trình chạy thử nghiệm cho thấy:
*   Rust Core bắt đầu hook thành công vào tầng hệ thống Windows (Windows API) mà không gây giật lag (overhead cực thấp).
*   Mỗi sự kiện Key Press / Key Release được gửi đi liên tục với độ trễ xấp xỉ ~0.005ms qua kênh giao tiếp bảo mật (Pipe/WebSocket).
*   Phần mềm thực hiện block (chặn) thành công thao tác bàn phím ngay tại khoảnh khắc nhận diện được chùm keystrokes bất thường (chỉ mất chưa tới vài mili-giây).

[👉 CHÈN ẢNH CHỤP TỪ TAB "Realtime Monitor" TẠI ĐÂY]
*Hình 4.4: Giao diện Realtime Monitor giám sát và chặn bắt lập tức các phím bấm giả mạo từ BadUSB.*

---

## 4.3. Đánh giá kết quả

Qua việc thực thi bộ kiểm thử tự động trên tập dữ liệu gồm 21.173 mẫu (bao gồm 20.941 mẫu thao tác người dùng bình thường và 232 mẫu tấn công BadUSB), hệ thống cho thấy những con số cực kỳ khả quan. Dưới đây là thống kê hiệu suất chi tiết đối với từng phương pháp tiếp cận:

**1. Phương pháp dựa trên tập luật (Rule-based) và Mô hình Rừng ngẫu nhiên (Random Forest)**
*   **Độ chính xác (Accuracy):** Đạt mức tuyệt đối 100%.
*   **Độ chuẩn xác (Precision) & Độ bao phủ (Recall):** 100%.
*   **Đánh giá:** Hai phương pháp này không sinh ra bất kỳ cảnh báo sai (False Positive) hay bỏ lọt tấn công (False Negative) nào trong tập kiểm thử. Đặc thù này có được là nhờ sự khác biệt rất lớn và rõ rệt giữa nhịp độ gõ phím sinh học của con người (thường lớn hơn 30ms/phím) và tốc độ tự động hóa của phần cứng máy tính (chỉ từ 0 đến 5ms/phím).
*   **Độ trễ xử lý (Latency):** Random Forest cho ra kết quả dự đoán với tốc độ xấp xỉ 0.005 mili-giây, cực kỳ tối ưu và nhẹ nhàng cho một công cụ giám sát chạy nền liên tục.

**2. Các phương pháp phát hiện bất thường độc lập (Isolation Forest & One-Class SVM)**
*   **Isolation Forest:** Độ chính xác tổng thể đạt 91.04%. Thuật toán phát hiện được 100% (Recall) các mẫu tấn công nhưng lại bị dính tỷ lệ cảnh báo sai khá lớn trên thao tác của người dùng.
*   **One-Class SVM:** Đạt độ chính xác tổng thể 89.94% và cũng phát hiện được toàn bộ cuộc tấn công (Recall 100%).
*   **Đánh giá:** Các thuật toán phát hiện điểm bất thường này rất nhạy bén, tuy nhiên nếu hoạt động độc lập, chúng có thể nhầm lẫn những lúc người dùng gõ phím quá nhanh thành tấn công, dẫn tới trải nghiệm chưa thực sự hoàn hảo.

**3. Đề xuất áp dụng Mô hình lai (Hybrid Model)**
*   **Kiến trúc:** Là sự kết hợp chặt chẽ giữa ngưỡng quy tắc cứng (chiếm trọng số 0.6) và dự đoán xác suất linh hoạt của máy học (chiếm trọng số 0.4).
*   **Hiệu suất:** Đạt độ chính xác, độ chuẩn xác và độ bao phủ đồng loạt ở mức tuyệt đối 100%. Chỉ số AUC-ROC đạt mức lý tưởng 1.00.
*   **Kết luận:** Đây là phương án triển khai tối ưu nhất. Sự kết hợp này mang lại khả năng phòng thủ vững chắc ngay cả khi kẻ tấn công tinh vi cố tình chèn thêm các khoảng trễ ngẫu nhiên (Jitter) vào thiết bị BadUSB nhằm qua mặt quy tắc thời gian. Mọi cuộc tấn công giả lập đều bị thuật toán nội suy bất thường và chặn đứng thành công, trước cả khi câu lệnh PowerShell độc hại đầu tiên kịp nhấn phím Enter.

[👉 CHÈN ẢNH CHỤP TỪ TAB "Dashboard" TẠI ĐÂY]
*Hình 4.5: Giao diện Dashboard tổng quan thể hiện trạng thái hoạt động ổn định và an toàn của hệ thống.*

[👉 CHÈN ẢNH CHỤP TỪ TAB "Alerts" HOẶC "Logs" TẠI ĐÂY]
*Hình 4.6: Bảng lịch sử cảnh báo (Alerts/Logs) ghi nhận chi tiết thời gian và loại hình tấn công BadUSB bị ngăn chặn.*
