"use client";
import React, { useState, useRef } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  TextField,
  CircularProgress,
  Typography,
  Stack,
  Dialog,
  Slide,
  StepContent,
} from "@mui/material"; 
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/system";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";
import { CloudUpload, Image, Mic } from "@mui/icons-material";
import Album from "./Modals/album";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import PauseIcon from "@mui/icons-material/Pause";

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  padding: "0",
  width: "1px",
  backgroundColor: "#bdbdbd",
}));

const customTextfieldOutline = {
  "& .MuiOutlinedInput-root": {
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.42)", // Keep the default border color on hover
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#1976d2", // Use a distinctive color for the focused state
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0, 0, 0, 0.42)", // Default border color
  },
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Form = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [handleStep1Next, setHandleStep1Next] = useState(false);
  const [handleStep2Next, setHandleStep2Next] = useState(false);
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryEvents, setMemoryEvents] = useState(null);
  const [events, setEvents] = useState([]);
  const [viewImages, setViewImages] = useState(false);
  const [albumData, setAlbumData] = useState({
    count: 0,
    id: null,
    title: "Album",
    story: null,
    event: null
  });
  const [albumActiveStep, setAlbumActiveStep] = useState(0);
  const [nextEvent, setNextEvent] = useState("NEXT");
  const [albumTitle, setAlbumTitle] = useState(null);

  const steps = [
    {
      label: "Share a memory",
      description:
        "Manually enter your memory of events or record an audio below (file size must be under 10 MB).",
    },
    {
      label: "Validate memory elements",
      description:
        "Verify events, locations, and individuals. Manually update descriptions as needed or upload a reference image (under 5 MB) of each location or individual to ensure accuracy.",
    },
    {
      label: "See memory pictures!",
      description: "Album has been generated, wait for the images to load.",
    },
  ];
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [locationImgUpload, setLocationImgUpload] = useState([]);
  const [personImgUpload, setPersonImgUpload] = useState([]);
  const [albumArr, setAlbumArr] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);

  const ffmpeg = createFFmpeg({
    log: true,
  });

  const startRecording = async () => {
    setIsRecording(true);
    setTimer(0);
    audioChunks.current = [];

    // Start the timer
    timerInterval.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    mediaRecorderRef.current = new MediaRecorder(stream);

    // Collect the audio data
    mediaRecorderRef.current.ondataavailable = (event) => {
      console.log("Data available:", event.data); // Check if data is available
      audioChunks.current.push(event.data);

      // Stop recording when data is available and recording has been active long enough
      if (audioChunks.current.length >= 1) {
        // You can adjust the condition
        console.log("Enough data collected. Stopping the recording.");
        stopRecording();
      }
    };

    mediaRecorderRef.current.onstop = () => {
      console.log("Recording stopped, audio chunks:", audioChunks.current);
    };

    mediaRecorderRef.current.start();
    console.log("Recording started...");
  };

  // Stop recording
  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(timerInterval.current);
    setAudioLoading(true); // Start loading state

    // Stop the media recorder
    mediaRecorderRef.current.stop();
    console.log("Stop button clicked, stopping the recording.");

    if (audioChunks.current.length === 0) {
      console.log("No audio chunks available right now.");
      return;
    }

    try {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const webmFile = new File([blob], "audio.webm");

      // Load FFmpeg if not loaded
      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      console.log("Converting to MP3...");
      await ffmpeg.FS("writeFile", "audio.webm", await fetchFile(webmFile));

      // Convert WebM to MP3
      await ffmpeg.run("-i", "audio.webm", "audio.mp3");

      // Read the MP3 file
      const mp3Data = ffmpeg.FS("readFile", "audio.mp3");
      const mp3Blob = new Blob([mp3Data.buffer], { type: "audio/mpeg" });

      console.log("MP3 conversion completed!");

      // upload the MP3 file
      uploadAudio(mp3Blob);
    } catch (error) {
      console.error("Error during audio processing:", error);
      setAudioLoading(false); // Stop loading state in case of error
    }
  };

  // Upload the audio file to the API
  const uploadAudio = async (mp3Blob) => {
    const formData = new FormData();
    formData.append("file", mp3Blob, "audio.mp3");

    try {
      console.log("Uploading...");
      const response = await fetch(
        "https://autobiographygallery.com/api/transcribe",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const res = await response.json();
        console.log("Upload successful!");
        setMemoryInput(res.text);
        setAudioLoading(false);
      } else {
        console.log("Upload failed.");
        setAudioLoading(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  // Format time in mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleImageChange = async (event, index, element) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "image/jpeg" || file.type === "image/png") {
        if (element == "locations") {
          const newUploading = [...locationImgUpload];
          newUploading[index] = true;
          setLocationImgUpload(newUploading);
        } else {
          const newUploading = [...personImgUpload];
          newUploading[index] = true;
          setPersonImgUpload(newUploading);
        }

        await handleUpload(file, index, element);
      } else {
        alert("Please upload a JPG or PNG image.");
      }
    }
  };

  const handleUpload = async (image, index, element) => {
    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch(
        "https://autobiographygallery.com/api/describe-image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (element == "locations") {
        updateFieldValue(index, "locations", "description", result.description);
      } else {
        updateFieldValue(index, "people", "description", result.description);
      }
      console.log("Upload success:", result);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      if (element == "locations") {
        const newUploading = [...locationImgUpload];
        newUploading[index] = false;
        setLocationImgUpload(newUploading);
      } else {
        const newUploading = [...personImgUpload];
        newUploading[index] = false;
        setPersonImgUpload(newUploading);
      }
    }
  };

  const generateMemoryEvents = async () => {
    setHandleStep1Next(true);
    const data = {
      "raw-memory": memoryInput,
    };
    try {
      const response = await axios.post(
        "https://autobiographygallery.com/api/memory-elements",
        data
      );
      setMemoryEvents(response.data);
      let events = [];
      for (let i = 0; i < response.data.events.length; i++) {
        events.push(response.data.events[i].name);
      }
      setEvents(events);
      if (events.length > 1) {
        setNextEvent(events[1]);
      }
      setAlbumTitle(events[0]);
      setHandleStep1Next(false);
      setActiveStep(1);
    } catch (error) {
      console.log(error);
    }
  };

  const generateAlbum = async () => {
    setHandleStep2Next(true);
    const data = {
      raw_memory: memoryInput,
      memory_elements: memoryEvents,
      related_event: events[0],
    };
    try {
      const response = await axios.post(
        "https://autobiographygallery.com/api/generate-album",
        data
      );
      const albumMetadata = {
        count: response.data.size,
        id: response.data.id,
        title: response.data.title,
        story: response.data.story,
        event: events[0]
      };
      setAlbumData((prev) => ({
        ...prev,
        ...albumMetadata,
      }));
      setHandleStep2Next(false);
      setActiveStep(2);
      setViewImages(true);
    } catch (error) {
      console.log(error);
    }
  };

  const updateFieldValue = (index, type, field, value) => {
    const updatedEvents = { ...memoryEvents };
    updatedEvents[type][index][field] = value;
    setMemoryEvents(updatedEvents);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "5%",
        padding: "40px",
      }}
    >
      <Box
        sx={{
          width: "20%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stepper
          activeStep={activeStep}
          connector={<CustomConnector />}
          sx={{ height: "800px" }}
          orientation="vertical"
        >
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography fontWeight={500} fontSize="13px">
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography fontWeight={500} fontSize="14px">
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
      <Box sx={{ width: "75%" }}>
        {activeStep === 0 && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <TextField
                label="Share Your Memory"
                placeholder="Type your memory here..."
                value={memoryInput}
                onChange={(e) => setMemoryInput(e.target.value)}
                multiline
                rows={35}
                variant="outlined"
                fullWidth
                sx={customTextfieldOutline}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <LoadingButton
                variant="outlined"
                startIcon={isRecording ? <PauseIcon /> : <Mic />}
                onClick={isRecording ? stopRecording : startRecording}
                loading={audioLoading}
                disabled={audioLoading}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1976d2",
                  width: "100px",
                  padding: "7.5px 10px",
                  ".MuiButton-startIcon": {
                    margin: "0",
                  },
                }}
              >
                {isRecording ? `${formatTime(timer)}` : null}{" "}
              </LoadingButton>
              <LoadingButton
                variant="contained"
                sx={{
                  bgcolor: "#1976d2",
                  display: "flex",
                  alignItems: "center",
                }}
                loading={handleStep1Next}
                loadingIndicator={
                  <CircularProgress size={24} color="inherit" />
                }
                endIcon={<ArrowForwardIcon />}
                onClick={generateMemoryEvents}
              >
                NEXT
              </LoadingButton>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box
            sx={{
              width: "100%",
              height: "900px",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                mb: "30px",
                width: "100%",
              }}
            >
              <Typography variant="h5">EVENTS</Typography>
              {memoryEvents?.events?.map((item, index) => (
                <Box
                  key={index}
                  mt={index == 0 ? "20px" : "35px"}
                  width="706px"
                >
                  <TextField
                    disabled
                    label={`Event ${index + 1} Name`}
                    value={item.name}
                    onChange={(e) =>
                      updateFieldValue(index, "events", "name", e.target.value)
                    }
                    fullWidth
                    sx={{
                      mb: "15px",
                      ...customTextfieldOutline,
                    }}
                  />
                  <TextField
                    label={`Event ${index + 1} Description`}
                    value={item.description}
                    onChange={(e) =>
                      updateFieldValue(
                        index,
                        "events",
                        "description",
                        e.target.value
                      )
                    }
                    fullWidth
                    multiline
                    rows={2}
                    sx={customTextfieldOutline}
                  />
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                mb: "30px",
                width: "100%",
              }}
            >
              <Typography variant="h5" mt={2}>
                LOCATIONS
              </Typography>
              {memoryEvents?.locations?.map((item, index) => (
                <Box
                  key={index}
                  mt={index == 0 ? "20px" : "35px"}
                  sx={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <Box flex={1}>
                    <TextField
                      disabled
                      label={`Location ${index + 1} Name`}
                      value={item.name}
                      onChange={(e) =>
                        updateFieldValue(
                          index,
                          "locations",
                          "name",
                          e.target.value
                        )
                      }
                      fullWidth
                      sx={{
                        mb: "15px",
                        ...customTextfieldOutline,
                      }}
                    />
                    <TextField
                      label={`Location ${index + 1} Description`}
                      value={item.description}
                      onChange={(e) =>
                        updateFieldValue(
                          index,
                          "locations",
                          "description",
                          e.target.value
                        )
                      }
                      fullWidth
                      multiline
                      rows={2}
                      sx={customTextfieldOutline}
                    />
                  </Box>
                  <div>
                    <input
                      accept="image/*"
                      type="file"
                      id={`image-upload-${index}`}
                      style={{ display: "none" }} // Hide the default file input
                      onChange={(e) => handleImageChange(e, index, "locations")}
                    />

                    <label htmlFor={`image-upload-${index}`}>
                      <LoadingButton
                        component="span"
                        color="primary"
                        loading={locationImgUpload[index]}
                        loadingIndicator={<CircularProgress size={24} />}
                        disabled={locationImgUpload[index]}
                        style={{
                          borderRadius: "50%",
                          width: 56,
                          height: 56,
                          minWidth: 56,
                          padding: 0,
                        }}
                      >
                        <CloudUpload />
                      </LoadingButton>
                    </label>
                  </div>
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                mb: "30px",
                width: "100%",
              }}
            >
              <Typography variant="h5" mt={2}>
                PEOPLE
              </Typography>
              {memoryEvents?.people?.map((item, index) => (
                <Box
                  key={index}
                  mt={index == 0 ? "20px" : "35px"}
                  sx={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <Box flex={1}>
                    <TextField
                      disabled
                      label={`Person ${index + 1} Name`}
                      value={item.name}
                      onChange={(e) =>
                        updateFieldValue(
                          index,
                          "people",
                          "name",
                          e.target.value
                        )
                      }
                      fullWidth
                      sx={{
                        mb: "15px",
                        ...customTextfieldOutline,
                      }}
                    />
                    <TextField
                      label={`Person ${index + 1} Description`}
                      value={item.description}
                      onChange={(e) =>
                        updateFieldValue(
                          index,
                          "people",
                          "description",
                          e.target.value
                        )
                      }
                      fullWidth
                      multiline
                      rows={2}
                      sx={customTextfieldOutline}
                    />
                  </Box>
                  <div>
                    <input
                      accept="image/*"
                      type="file"
                      id={`image-upload-${index}`}
                      style={{ display: "none" }} // Hide the default file input
                      onChange={(e) => handleImageChange(e, index, "people")}
                    />

                    <label htmlFor="image-upload">
                      <LoadingButton
                        component="span"
                        color="primary"
                        loading={personImgUpload[index]}
                        loadingIndicator={<CircularProgress size={24} />}
                        disabled={personImgUpload[index]}
                        style={{
                          borderRadius: "50%",
                          width: 56,
                          height: 56,
                          minWidth: 56,
                          padding: 0,
                        }}
                      >
                        <CloudUpload />
                      </LoadingButton>
                    </label>
                  </div>
                </Box>
              ))}
            </Box>
            <LoadingButton
              variant="contained"
              sx={{ bgcolor: "#1976d2", display: "flex", alignItems: "center" }}
              loading={handleStep2Next}
              loadingIndicator={<CircularProgress size={24} color="inherit" />}
              endIcon={<ArrowForwardIcon />}
              onClick={generateAlbum}
            >
              NEXT
            </LoadingButton>
          </Box>
        )}

        {activeStep == 2 && (
          <Stack alignItems="center" justifyContent="center">
            <Image
              sx={{
                color: "#aaa",
                height: "7rem",
                width: "7rem",
                marginBottom: "1rem",
                cursor: "pointer",
              }}
            />
            <Typography
              fontWeight={600}
              fontSize="24px"
              sx={{
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => setViewImages(true)}
            >
              View Images
            </Typography>
            {viewImages && (
              <Dialog
                fullScreen
                open={viewImages}
                TransitionComponent={Transition}
              >
                <Album
                  events={events}
                  memoryInput={memoryInput}
                  memoryElements={memoryEvents}
                  albumData={albumData}
                  setAlbumData={setAlbumData}
                  activeStep={albumActiveStep}
                  setActiveStep={setAlbumActiveStep}
                  nextEvent={nextEvent}
                  setNextEvent={setNextEvent}
                  albumTitle={albumTitle}
                  setAlbumTitle={setAlbumTitle}
                  albumArr={albumArr}
                  setAlbumArr={setAlbumArr}
                />
              </Dialog>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Form;
