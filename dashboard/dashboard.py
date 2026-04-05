# Dashboard hien thi realtime keystroke dynamics
# Chay: streamlit run dashboard.py

import os
import time
import json
from pathlib import Path

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots


st.set_page_config(
    page_title="KDS Guard Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)


st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 1rem 0;
    }
    .metric-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        border: 1px solid #333;
    }
    .risk-normal { color: #2ecc71; font-size: 1.5rem; font-weight: bold; }
    .risk-medium { color: #f39c12; font-size: 1.5rem; font-weight: bold; }
    .risk-high   { color: #e74c3c; font-size: 1.5rem; font-weight: bold; }
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-safe   { background: #27ae60; color: white; }
    .badge-warn   { background: #f39c12; color: white; }
    .badge-danger { background: #e74c3c; color: white; }
</style>
""", unsafe_allow_html=True)



with st.sidebar:
    st.image("https://img.icons8.com/3d-fluency/94/shield.png", width=80)
    st.title("🛡️ KDS Guard")
    st.markdown("**BadUSB Detection System**")
    st.markdown("---")

    # Data source
    data_dir = st.text_input("📂 Data Directory", value="data")
    model_dir = st.text_input("🤖 Model Directory", value="models")

    st.markdown("---")
    st.markdown("### ⚙️ Detection Settings")
    ft_threshold = st.slider("Flight Time Threshold (ms)", 10, 100, 30)
    cv_threshold = st.slider("CV Threshold", 0.05, 0.50, 0.15, 0.01)
    speed_threshold = st.slider("Max Speed (keys/s)", 5, 50, 15)

    st.markdown("---")
    auto_refresh = st.checkbox("🔄 Auto Refresh", value=False)
    if auto_refresh:
        refresh_rate = st.slider("Refresh interval (s)", 1, 30, 5)



@st.cache_data(ttl=5)
def load_features_data(data_dir: str) -> pd.DataFrame:
    """Load features dataset."""
    path = os.path.join(data_dir, "features_dataset.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()


@st.cache_data(ttl=5)
def load_keystroke_log(data_dir: str) -> pd.DataFrame:
    """Load latest keystroke log."""
    import glob
    logs = glob.glob(os.path.join(data_dir, "keystroke_log_*.csv"))
    if logs:
        latest = max(logs, key=os.path.getmtime)
        return pd.read_csv(latest)
    return pd.DataFrame()


@st.cache_data(ttl=60)
def load_model_metadata(model_dir: str) -> dict:
    """Load training metadata."""
    path = os.path.join(model_dir, "training_metadata.json")
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {}


def compute_risk_score(features: dict, ft_thresh: float, cv_thresh: float, speed_thresh: float) -> float:
    """Tinh risk score."""
    score = 0.0

    if features.get('mean_flight_time', 999) < ft_thresh:
        score += 0.3
    if features.get('cv_flight_time', 1.0) < cv_thresh:
        score += 0.25
    if features.get('typing_speed', 0) > speed_thresh:
        score += 0.25
    if features.get('has_burst', False):
        score += 0.2

    return min(score, 1.0)



st.markdown('<div class="main-header">🛡️ KDS Guard Dashboard</div>', unsafe_allow_html=True)
st.markdown('<p style="text-align:center; color:#888;">BadUSB Detection via Keystroke Dynamics Analysis</p>',
            unsafe_allow_html=True)

# Load data
df_features = load_features_data(data_dir)
df_log = load_keystroke_log(data_dir)
metadata = load_model_metadata(model_dir)


tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Overview", "🔍 Live Monitor", "📈 Analysis", "🤖 Model", "📋 Detection Log"
])


with tab1:
    st.subheader("System Overview")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_events = len(df_log) if not df_log.empty else 0
        st.metric("📝 Total Events", f"{total_events:,}")

    with col2:
        total_windows = len(df_features) if not df_features.empty else 0
        st.metric("🪟 Windows Analyzed", f"{total_windows:,}")

    with col3:
        if not df_features.empty and 'label' in df_features.columns:
            injections = (df_features['label'] != 'human').sum()
            st.metric("🚨 Injections Detected", injections)
        else:
            st.metric("🚨 Injections Detected", "N/A")

    with col4:
        if not df_features.empty and 'typing_speed' in df_features.columns:
            avg_speed = df_features['typing_speed'].mean()
            st.metric("⌨️ Avg Speed", f"{avg_speed:.1f} k/s")
        else:
            st.metric("⌨️ Avg Speed", "N/A")

    st.markdown("---")

    # Status
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("🔒 System Status")
        if df_features.empty:
            st.warning("⏳ No data collected yet. Run KDS Guard collector first.")
            st.code("cd kds_guard && cargo run -- --collect-only --log-keys -v", language="bash")
        else:
            st.success("✅ System is operational")
            st.info(f"📂 Data directory: `{data_dir}`")

    with col_right:
        st.subheader("📂 Data Summary")
        if not df_features.empty:
            summary_data = {
                "Feature": ["Samples", "Features", "Labels"],
                "Value": [
                    len(df_features),
                    len(df_features.columns),
                    df_features['label'].nunique() if 'label' in df_features.columns else "N/A"
                ]
            }
            st.table(pd.DataFrame(summary_data))


with tab2:
    st.subheader("🔍 Real-time Typing Monitor")

    if df_features.empty:
        st.info("⏳ Waiting for data... Run the collector to start monitoring.")
    else:
        # Latest window stats
        latest = df_features.iloc[-1] if not df_features.empty else {}

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            speed = latest.get('typing_speed', 0)
            st.metric("⌨️ Current Speed", f"{speed:.1f} k/s",
                       delta=f"{'⚠️ HIGH' if speed > speed_threshold else '✅ OK'}")
        with col2:
            cv = latest.get('cv_flight_time', 1.0)
            st.metric("📊 CV Flight Time", f"{cv:.3f}",
                       delta=f"{'⚠️ LOW' if cv < cv_threshold else '✅ OK'}")
        with col3:
            ft = latest.get('mean_flight_time', 0)
            st.metric("⏱️ Mean Flight Time", f"{ft:.1f} ms",
                       delta=f"{'⚠️ FAST' if ft < ft_threshold else '✅ OK'}")
        with col4:
            risk = compute_risk_score(latest.to_dict() if hasattr(latest, 'to_dict') else {},
                                       ft_threshold, cv_threshold, speed_threshold)
            risk_class = "risk-normal" if risk < 0.3 else "risk-medium" if risk < 0.7 else "risk-high"
            st.markdown(f'<div class="{risk_class}">Risk: {risk:.0%}</div>', unsafe_allow_html=True)

        st.markdown("---")

        # Real-time charts
        col_chart1, col_chart2 = st.columns(2)

        with col_chart1:
            if 'typing_speed' in df_features.columns:
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    y=df_features['typing_speed'].tail(50),
                    mode='lines+markers',
                    name='Typing Speed',
                    line=dict(color='#3498db', width=2),
                    marker=dict(size=4),
                ))
                fig.add_hline(y=speed_threshold, line_dash="dash", line_color="red",
                              annotation_text=f"Threshold ({speed_threshold} k/s)")
                fig.update_layout(
                    title="Typing Speed (last 50 windows)",
                    yaxis_title="Keys/second",
                    template="plotly_dark",
                    height=350,
                )
                st.plotly_chart(fig, use_container_width=True)

        with col_chart2:
            if 'cv_flight_time' in df_features.columns:
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    y=df_features['cv_flight_time'].tail(50),
                    mode='lines+markers',
                    name='CV Flight Time',
                    line=dict(color='#e67e22', width=2),
                    marker=dict(size=4),
                ))
                fig.add_hline(y=cv_threshold, line_dash="dash", line_color="red",
                              annotation_text=f"Threshold ({cv_threshold})")
                fig.update_layout(
                    title="CV Flight Time (last 50 windows)",
                    yaxis_title="Coefficient of Variation",
                    template="plotly_dark",
                    height=350,
                )
                st.plotly_chart(fig, use_container_width=True)


with tab3:
    st.subheader("📈 Keystroke Dynamics Analysis")

    if df_features.empty:
        st.info("⏳ No features data available yet.")
    else:
        col1, col2 = st.columns(2)

        with col1:
            # Scatter: CV vs Speed
            if 'cv_flight_time' in df_features.columns and 'typing_speed' in df_features.columns:
                color_col = 'label' if 'label' in df_features.columns else None
                fig = px.scatter(
                    df_features, x='cv_flight_time', y='typing_speed',
                    color=color_col,
                    color_discrete_map={'human': '#2ecc71', 'injection': '#e74c3c'},
                    title='CV vs Typing Speed (Detection Space)',
                    labels={'cv_flight_time': 'CV Flight Time', 'typing_speed': 'Speed (k/s)'},
                    template='plotly_dark',
                    opacity=0.7,
                )
                fig.add_hline(y=speed_threshold, line_dash="dash", line_color="orange")
                fig.add_vline(x=cv_threshold, line_dash="dash", line_color="orange")
                fig.update_layout(height=400)
                st.plotly_chart(fig, use_container_width=True)

        with col2:
            # Distribution: Flight Time
            if 'mean_flight_time' in df_features.columns:
                color_col = 'label' if 'label' in df_features.columns else None
                fig = px.histogram(
                    df_features, x='mean_flight_time',
                    color=color_col,
                    color_discrete_map={'human': '#2ecc71', 'injection': '#e74c3c'},
                    title='Flight Time Distribution',
                    labels={'mean_flight_time': 'Mean Flight Time (ms)'},
                    template='plotly_dark',
                    barmode='overlay',
                    opacity=0.7,
                    nbins=40,
                )
                fig.update_layout(height=400)
                st.plotly_chart(fig, use_container_width=True)

        # Correlation heatmap
        st.subheader("🔥 Feature Correlation")
        numeric_cols = df_features.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [c for c in numeric_cols if c not in
                        ['window_start_ms', 'window_end_ms', 'num_keys']]

        if len(feature_cols) >= 3:
            corr = df_features[feature_cols].corr()
            fig = px.imshow(
                corr,
                text_auto='.2f',
                color_continuous_scale='RdBu_r',
                title='Feature Correlation Heatmap',
                template='plotly_dark',
            )
            fig.update_layout(height=500)
            st.plotly_chart(fig, use_container_width=True)


with tab4:
    st.subheader("🤖 ML Model Performance")

    if not metadata:
        st.info("⏳ No model trained yet. Run train_model.py first.")
        st.code("python scripts/train_model.py", language="bash")
    else:
        st.write(f"📅 Trained at: {metadata.get('timestamp', 'N/A')}")
        st.write(f"📊 Training samples: {metadata.get('n_samples', 'N/A')}")

        results = metadata.get('results', [])
        if results:
            # Model comparison chart
            models_df = pd.DataFrame(results)

            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=models_df['model_name'], y=models_df['f1_score'],
                name='F1-Score', marker_color='#3498db'
            ))
            fig.add_trace(go.Bar(
                x=models_df['model_name'], y=models_df['auc_roc'],
                name='AUC-ROC', marker_color='#e74c3c'
            ))
            fig.update_layout(
                title='Model Comparison',
                barmode='group',
                template='plotly_dark',
                yaxis_range=[0, 1.1],
                height=400,
            )
            st.plotly_chart(fig, use_container_width=True)

            # Detail table
            st.subheader("📋 Detailed Results")
            display_df = models_df[['model_name', 'accuracy', 'f1_score', 'auc_roc',
                                     'precision_injection', 'recall_injection']].copy()
            display_df.columns = ['Model', 'Accuracy', 'F1', 'AUC', 'Precision', 'Recall']
            st.dataframe(display_df.style.format({
                'Accuracy': '{:.4f}', 'F1': '{:.4f}', 'AUC': '{:.4f}',
                'Precision': '{:.4f}', 'Recall': '{:.4f}'
            }), use_container_width=True)

            # Best model highlight
            best = max(results, key=lambda r: r.get('f1_score', 0))
            st.success(f"🏆 Best Model: **{best['model_name']}** (F1: {best['f1_score']:.4f})")


with tab5:
    st.subheader("📋 Detection Log")

    if df_features.empty:
        st.info("⏳ No detection data available yet.")
    else:
        # Filter controls
        col1, col2 = st.columns(2)
        with col1:
            if 'label' in df_features.columns:
                label_filter = st.multiselect(
                    "Filter by label",
                    options=df_features['label'].unique().tolist(),
                    default=df_features['label'].unique().tolist()
                )
            else:
                label_filter = None

        with col2:
            n_rows = st.slider("Show last N rows", 10, 500, 100)

        # Apply filter
        display_df = df_features.copy()
        if label_filter and 'label' in display_df.columns:
            display_df = display_df[display_df['label'].isin(label_filter)]

        display_df = display_df.tail(n_rows)

        # Display
        st.dataframe(
            display_df.style.format({col: '{:.2f}' for col in display_df.select_dtypes(include=[np.number]).columns}),
            use_container_width=True,
            height=500,
        )

        # Download button
        csv = display_df.to_csv(index=False)
        st.download_button(
            "📥 Download CSV",
            csv,
            "detection_log.csv",
            "text/csv",
        )


if auto_refresh:
    time.sleep(refresh_rate)
    st.rerun()


st.markdown("---")
st.markdown(
    '<p style="text-align:center; color:#888;">KDS Guard v0.1.0 | '
    'BadUSB Detection via Keystroke Dynamics | '
    '© 2026</p>',
    unsafe_allow_html=True
)
