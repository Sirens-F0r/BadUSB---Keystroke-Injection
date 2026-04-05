========================================
  KDS Guard - BadUSB Detection
  Do An Co So 2026
========================================

HUONG DAN SU DUNG USB NAY
--------------------------

1. BAO CAO
   Mo file: 1_BAOCAO/BAOCAO_DOAN.docx

2. CHAY DEMO NHANH (khong can cai dat gi)
   
   a) Phat hien tan cong:
      - Click phai "3_DEMO/demo_detect.bat" -> Run as administrator
      - Go phim binh thuong -> he thong hien "Normal"
      - Go sieu nhanh hoac dung script -> he thong canh bao + chan input
      - Nhan Ctrl+C de dung

   b) Chi thu thap du lieu:
      - Click "3_DEMO/demo_collect.bat"
      - Go phim 30 giay
      - File CSV tu dong luu vao thu muc data/

   c) Mo phong BadUSB:
      - Can Python 3.8+ (neu may khong co thi bo qua buoc nay)
      - Chay: python 3_DEMO/simulate_injection.py
      - Script se go phim tu dong, KDS Guard se phat hien va chan

3. XEM MA NGUON
   Mo thu muc: 2_SOURCE_CODE/DOANCOSO/
   - kds_guard/src/     -> Rust engine (7 files)
   - kds-guard-dashboard/ -> React dashboard
   - scripts/           -> Python scripts

4. XEM DATASET
   Mo file: 4_DATASET/features_dataset.csv (bang Excel)
   21,035 mau du lieu tu 51+ nguoi dung

5. YEU CAU HE THONG
   - Windows 10/11
   - Quyen Administrator (cho BlockInput API)
   - Python 3.8+ (chi can cho simulate_injection)
   - Khong can cai Rust hay Node.js (da build san)

========================================
  Lien he: [Ten sinh vien] - [MSSV]
========================================
