# ============================================================
# LULC Bar Charts — Dhaka District (2015, 2025, 2035 Projected)
# Manuscript: EJRS-D-25-00228
#
# Produces three separate charts:
#   Fig. 3 — Land Cover Area 2015
#   Fig. 4 — Land Cover Area 2025
#   Fig. 6 — Land Cover Area 2035 (Projected)
#
# HOW TO USE:
#   1. Run this entire script (Ctrl + Shift + Enter)
#   2. Each chart will appear in the Plots panel one at a time
#   3. After each chart appears:
#      Click Export → Save as Image → PNG
#      Recommended size: 2126 x 2362 pixels (600 dpi equivalent)
#      Save with the filename shown in the comments above each plot
#   4. Run the next section to generate the next chart
#
# To generate all three at once and cycle through them,
# run the entire script — use the arrows in the Plots panel
# to navigate between the three charts.
#
# Required packages:
#   install.packages(c("ggplot2", "scales"))
#
# LULC Area Values:
#   2015:  Water = 450.29 km², Built-up = 537.82 km², Green = 623.09 km²
#   2025:  Water = 321.18 km², Built-up = 782.18 km², Green = 507.92 km²
#   2035:  Water = 229.09 km², Built-up = 968.15 km², Green = 414.04 km²
#
# Classification accuracy (2025): OA = 92.9%, Kappa = 0.88
# Markov chain projection: Business-as-usual scenario
# ============================================================

library(ggplot2)
library(scales)

# ── Shared colours ────────────────────────────────────────────
fill_cols   <- c("Water"      = "#0c2c84",
                 "Built-up"   = "#dfff0b",
                 "Green Area" = "#008000")

border_cols <- c("Water"      = "#091e60",
                 "Built-up"   = "#b8cc00",
                 "Green Area" = "#005200")

# ── Shared theme ──────────────────────────────────────────────
journal_theme <- theme_classic(base_size = 11, base_family = "serif") +
  theme(
    plot.title         = element_text(size = 10, face = "bold",
                                      hjust = 0,
                                      margin = margin(b = 8)),
    axis.title.x       = element_text(size = 9,
                                      margin = margin(t = 6)),
    axis.title.y       = element_text(size = 9,
                                      margin = margin(r = 6)),
    axis.text.x        = element_text(size = 8.5, color = "black"),
    axis.text.y        = element_text(size = 8,   color = "black"),
    axis.line          = element_line(color = "black",
                                      linewidth = 0.4),
    axis.ticks         = element_line(color = "black",
                                      linewidth = 0.3),
    axis.ticks.length  = unit(2.5, "pt"),
    panel.grid.major.y = element_line(color     = "grey85",
                                      linewidth  = 0.3,
                                      linetype   = "dashed"),
    panel.grid.major.x = element_blank(),
    panel.grid.minor   = element_blank(),
    legend.title         = element_blank(),
    legend.text          = element_text(size = 8),
    legend.key.size      = unit(0.4, "cm"),
    legend.key           = element_rect(color     = "grey40",
                                        linewidth  = 0.3),
    legend.position      = c(0.98, 0.98),
    legend.justification = c("right", "top"),
    legend.direction     = "horizontal",
    legend.spacing.x     = unit(0.3, "cm"),
    legend.margin        = margin(t = 3, r = 4, b = 3, l = 4),
    legend.background    = element_rect(fill      = "white",
                                        color     = "grey70",
                                        linewidth  = 0.3),
    plot.margin          = margin(12, 14, 8, 10),
    plot.background      = element_rect(fill = "white", color = NA),
    panel.background     = element_rect(fill = "white", color = NA)
  )

# ── Shared plot function ──────────────────────────────────────
make_chart <- function(df, title_text) {

  ggplot(df, aes(x = Class, y = Area,
                 fill = Class, color = Class)) +

    geom_col(
      width       = 0.52,
      linewidth   = 0.4,
      show.legend = TRUE
    ) +

    geom_text(
      aes(label = formatC(Area, format = "f", digits = 2)),
      vjust    = -0.55,
      size     = 3.0,
      fontface = "bold",
      family   = "serif",
      color    = "black"
    ) +

    scale_fill_manual(
      values = fill_cols,
      breaks = c("Water", "Built-up", "Green Area")
    ) +
    scale_color_manual(values = border_cols, guide = "none") +

    scale_y_continuous(
      limits = c(0, 1450),
      breaks = seq(0, 1400, by = 200),
      expand = expansion(mult = c(0, 0.01)),
      labels = comma
    ) +

    labs(
      title = title_text,
      x     = "Land cover class",
      y     = expression("Area (km"^2*")")
    ) +

    guides(
      fill = guide_legend(
        nrow         = 1,
        override.aes = list(color = border_cols, linewidth = 0.4)
      )
    ) +

    journal_theme
}


# ============================================================
# FIG. 3 — LULC 2015
# Save as: LULC_2015.png
# ============================================================

df_2015 <- data.frame(
  Class = factor(c("Water", "Built-up", "Green Area"),
                 levels = c("Water", "Built-up", "Green Area")),
  Area  = c(450.29, 537.82, 623.09)
)

p_2015 <- make_chart(
  df         = df_2015,
  title_text = "Land Cover Area \u2014 Dhaka District (2015)"
)

print(p_2015)


# ============================================================
# FIG. 4 — LULC 2025
# Save as: LULC_2025.png
# ============================================================

df_2025 <- data.frame(
  Class = factor(c("Water", "Built-up", "Green Area"),
                 levels = c("Water", "Built-up", "Green Area")),
  Area  = c(321.18, 782.18, 507.92)
)

p_2025 <- make_chart(
  df         = df_2025,
  title_text = "Land Cover Area \u2014 Dhaka District (2025)"
)

print(p_2025)


# ============================================================
# FIG. 6 — LULC 2035 PROJECTED
# Save as: LULC_2035_Projected.png
# ============================================================

df_2035 <- data.frame(
  Class = factor(c("Water", "Built-up", "Green Area"),
                 levels = c("Water", "Built-up", "Green Area")),
  Area  = c(229.09, 968.15, 414.04)
)

p_2035 <- make_chart(
  df         = df_2035,
  title_text = "Land Cover Area \u2014 Dhaka District 2035 (Projected)"
)

print(p_2035)


# ============================================================
# All three charts generated.
# Use the left/right arrows in the RStudio Plots panel
# to navigate between them and save each one as PNG.
# ============================================================
