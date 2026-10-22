"""Streamlit analytics dashboard localized with t() and _()."""

from __future__ import annotations

import streamlit as st
from i18n import _, streamlit_language_selector, t


def main() -> None:
    st.set_page_config(page_title="Analytics", layout="wide")
    streamlit_language_selector(sidebar=True, key="lang_selector")
    user_name = "Ada"
    revenue = 1234.5
    metric = "revenue"
    row_count = 12
    st.title(_("Dashboard"))
    st.write(t("Welcome back, {user_name}!", user_name=user_name))
    st.write(t("Total revenue: ${revenue:,.2f}", revenue=revenue))
    st.write(_("Selected metric: %s") % metric)
    st.write(_("Showing %d rows") % row_count)


if __name__ == "__main__":
    main()
