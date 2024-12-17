"use client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import { Container, Typography, Box } from "@mui/material";
import PhotoAlbumIcon from "@mui/icons-material/PhotoAlbum";
import Form from "@/components/form";

const theme = createTheme();

export default function Home() {
  const wrapperStyles = {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
  };

  const flexPart1Styles = {
    minHeight: "100vh",
    width: "35%",
    bgcolor: "#121212",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const flexSubPart1Styles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    width: "500px",
    color: "white",
    textAlign: "center",
  };

  const flexPart2Styles = {
    minHeight: "100vh",
    width: "65%",
    bgcolor: "white",
    display: "flex",
    alignItems: "center",
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} disableGutters>
        <Box sx={wrapperStyles}>
          <Box sx={flexPart1Styles}>
            <Box sx={flexSubPart1Styles}>
              <PhotoAlbumIcon sx={{ fontSize: "120px", color: "#1976d2" }} />
              <Typography variant="h2" component="div" color="#1976d2">
                MemoryLane
              </Typography>
            </Box>
          </Box>
          <Box sx={flexPart2Styles}>
            <Form />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
