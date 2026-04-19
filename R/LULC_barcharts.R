# ============================================================
# LULC Bar Charts — Dhaka District (Three Separate Charts)
# Manuscript: EJRS-D-25-00228
#
# Produces three separate 600 dpi TIFF files:
#   LULC_2015.tiff
#   LULC_2025.tiff
#   LULC_2035_Projected.tiff
#
# Required packages:
#   install.packages(c("ggplot2", "scales"))
#
# Instructions:
#   1. Open this file in RStudio
#   2. Session → Set Working Directory → Choose Directory
#   3. Click Source or press Ctrl + Shift + Enter
#   4. Three TIFF files will appear in your working directory
#
# To update values: edit the Area = c(...) vectors only.
# Everything else scales automatically.
# ============================================================

library(ggplot2)
library(scales)

# ── Class factor (fixed order across all charts) ─────────────
classes <- factor(
  c("Water", "Built-up", "Green Area"),
  levels = c("Water", "Built-up", "Green Area")
)

# ── Colours matching GEE classification ──────────────────────
colours <- c(
  "Water"      = "#0c2c84",
  "Built-up"   = "#dfff0b",
  "Green Area" = "#008000"
)

border_colours <- c(
  "Water"      = "#091e60",
  "Built-up"   = "#b8cc00",
  "Green Area" = "#005200"
)

# ── Fixed y-axis across all three charts ─────────────────────
Y_MAX  <- 1450
Y_STEP <- 200

# ── Shared journal theme ──────────────────────────────────────
journal_theme <- theme_classic(base_size = 11, base_family = "serif") +
  theme(
    plot.title         = element_text(
                           size     = 10,
                           face     = "bold",
                           hjust    = 0,
                           margin   = margin(b = 2)
                         ),
    plot.subtitle      = element_text(
                           size     = 8.5,
                           face     = "italic",
                           hjust    = 0,
                           color    = "grey40",
                           margin   = margin(b = 8)
                         ),
    plot.caption       = element_text(
                           size     = 7,
                           face     = "italic",
                           color    = "grey50",
                           hjust    = 1,
                           margin   = margin(t = 6)
                         ),
    axis.title.x       = element_text(size = 9, face = "plain",
                                      margin = margin(t = 6)),
    axis.title.y       = element_text(size = 9, face = "plain",
                                      margin = margin(r = 6)),
    axis.text.x        = element_text(size = 8.5, color = "black"),
    axis.text.y        = element_text(size = 8,   color = "black"),
    axis.line          = element_line(color = "black", linewidth = 0.4),
    axis.ticks         = element_line(color = "black", linewidth = 0.3),
    axis.ticks.length  = unit(2.5, "pt"),
    panel.grid.major.y = element_line(color    = "grey85",
                                      linewidth = 0.3,
                                      linetype  = "dashed"),
    panel.grid.major.x = element_blank(),
    panel.grid.minor   = element_blank(),
    legend.title       = element_blank(),
    legend.text        = element_text(size = 8),
    legend.key.size    = unit(0.4, "cm"),
    legend.key         = element_rect(color = "grey40", linewidth = 0.3),
    legend.position    = "bottom",
    legend.direction   = "horizontal",
    legend.spacing.x   = unit(0.3, "cm"),
    legend.margin      = margin(t = 4),
    legend.background  = element_rect(fill = "white", color = NA),
    plot.margin        = margin(12, 14, 8, 10),
    plot.background    = element_rect(fill = "white", color = NA),
    panel.background   = element_rect(fill = "white", color = NA)
  )


# ── Chart function ────────────────────────────────────────────
make_chart <- function(df, title_text, subtitle_text,
                       caption_text = NULL, outfile) {

  p <- ggplot(df, aes(x = Class, y = Area, fill = Class)) +

    geom_col(
      aes(color = Class),
      width       = 0.52,
      linewidth   = 0.4,
      show.legend = FALSE
    ) +

    # Bold value labels above bars
    geom_text(
      aes(label = formatC(Area, format = "f", digits = 2)),
      vjust    = -0.55,
      size     = 3.0,
      fontface = "bold",
      family   = "serif",
      color    = "black"
    ) +

    scale_fill_manual(
      values = colours,
      breaks = c("Water", "Built-up", "Green Area")
    ) +
    scale_color_manual(values = border_colours, guide = "none") +

    scale_y_continuous(
      limits = c(0, Y_MAX),
      breaks = seq(0, 1400, by = Y_STEP),
      expand = expansion(mult = c(0, 0.01)),
      labels = comma
    ) +

    labs(
      title    = title_text,
      subtitle = subtitle_text,
      caption  = caption_text,
      x        = "Land cover class",
      y        = expression("Area (km"^2*")")
    ) +

    guides(
      fill = guide_legend(
        nrow         = 1,
        override.aes = list(color = border_colours, linewidth = 0.4)
      )
    ) +

    journal_theme

  ggsave(
    filename    = outfile,
    plot        = p,
    width       = 9,
    height      = 10,
    units       = "cm",
    dpi         = 600,
    device      = "tiff",
    compression = "lzw"
  )

  message("Saved: ", outfile)
  invisible(p)
}


# ============================================================
# CHART 1 — LULC 2015
# ============================================================

df_2015 <- data.frame(
  Class = classes,
  Area  = c(467.97, 524.30, 618.93)   # km² — update if needed
)

make_chart(
  df            = df_2015,
  title_text    = "(a)  Land cover area \u2014 Dhaka District (2015)",
  subtitle_text = "Landsat 8 OLI \u00B7 CART Classification \u00B7 OA = 92.9%, \u03BA = 0.88",
  outfile       = "LULC_2015.tiff"
)


# ============================================================
# CHART 2 — LULC 2025
# ============================================================

df_2025 <- data.frame(
  Class = classes,
  Area  = c(275.97, 825.21, 510.02)   # km² — update if needed
)

make_chart(
  df            = df_2025,
  title_text    = "(b)  Land cover area \u2014 Dhaka District (2025)",
  subtitle_text = "Landsat 9 OLI \u00B7 CART Classification \u00B7 OA = 92.9%, \u03BA = 0.88",
  outfile       = "LULC_2025.tiff"
)


# ============================================================
# CHART 3 — LULC 2035 PROJECTED
# ============================================================

df_2035 <- data.frame(
  Class = classes,
  Area  = c(162.75, 1298.41, 420.28)  # km² — update if needed
)

make_chart(
  df            = df_2035,
  title_text    = "(c)  Predicted land cover area \u2014 Dhaka District (2035)",
  subtitle_text = "Markov Chain Model \u00B7 Business-as-Usual Scenario",
  caption_text  = "Note: y-axis fixed at 0\u20131,450 km\u00B2 across all panels for direct comparison.",
  outfile       = "LULC_2035_Projected.tiff"
)

message("All three charts saved successfully.")
