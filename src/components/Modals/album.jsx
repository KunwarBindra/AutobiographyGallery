import { Close } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  MobileStepper,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
// import images from "../../json/images.json";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { useTheme } from "@mui/material/styles";

export default function Album({
  events,
  memoryInput,
  memoryElements,
  albumData,
  setAlbumData,
  activeStep,
  setActiveStep,
  nextEvent,
  setNextEvent,
  albumTitle,
  setAlbumTitle,
  albumArr,
  setAlbumArr,
}) {
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageData, setImageData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [exitMessage, setExitMessage] = useState(false);
  const [checkStepClick, setCheckStepClick] = useState(false);
  const hasFetched = useRef(false);

  const theme = useTheme();

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      setImagesLoading(true);
      fetchImages(albumData.count, 0, albumData);
    }
  }, []);

  useEffect(() => {
    if (checkStepClick) {
      if (activeStep + 1 < events.length) {
        setNextEvent(events[activeStep + 1]);
      }
      setAlbumTitle(events[activeStep]);
      const retrievedAlbum = albumArr.find(
        (item) => item.event == events[activeStep]
      );
      if (retrievedAlbum) {
        const albumMetadata = {
          count: retrievedAlbum.count,
          id: retrievedAlbum.id,
          title: retrievedAlbum.title,
          story: retrievedAlbum.story,
          event: events[activeStep]
        };
        setAlbumData((prev) => ({
          ...prev,
          ...albumMetadata,
        }));
        setImageData(retrievedAlbum.images);
        setSelectedImage(retrievedAlbum.images[0]);
      } else {
        handleNewAlbum(activeStep);
      }
    }
  }, [activeStep]);

  console.log(albumArr, "kunwar");

  const fetchImages = (imgCount, index, albumMetadata) => {
    const promises = [];
    for (let i = 0; i < imgCount; i++) {
      const data = {
        "album-id": albumData.id,
        "image-index": i,
      };
      promises.push(
        axios
          .post("https://autobiographygallery.com/api/album-image", data)
          .then(
            (response) => ({ status: "fulfilled", value: response.data }),
            (error) => ({ status: "rejected", reason: error })
          )
      );
    }
    Promise.allSettled(promises).then((results) => {
      const fulfilledResults = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      if (fulfilledResults.length > 0) {
        let images = [];
        for (let i = 0; i < fulfilledResults.length; i++) {
          images.push(fulfilledResults[i].value);
        }
        setImageData(images);
        setSelectedImage(images[0]);
        const updatedAlbumMetadata = { ...albumMetadata };
        updatedAlbumMetadata.images = images;
        const updatedAlbumArr = [...albumArr];
        updatedAlbumArr.push(updatedAlbumMetadata);
        setAlbumArr(updatedAlbumArr);
      } else {
        console.error("No images were loaded successfully.");
        setSelectedImage(null);
      }
      setImagesLoading(false);
    });
    // setImageData(images);
    // setSelectedImage(images[0]);
    // setImagesLoading(false);
  };

  const handleImageSelect = (item) => {
    setSelectedImage(item);
  };

  const handleNewAlbum = async (index) => {
    setImagesLoading(true);
    setSelectedImage(null);
    const data = {
      raw_memory: memoryInput,
      memory_elements: memoryElements,
      related_event: events[index],
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
        event: events[index]
      };
      setAlbumData((prev) => ({
        ...prev,
        ...albumMetadata,
      }));
      fetchImages(response.data.size, index, albumMetadata);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setCheckStepClick(true);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setCheckStepClick(true);
  };

  const action = (
    <>
      <Button
        color="secondary"
        size="small"
        onClick={() => window.location.reload()}
        sx={{ color: "#1976d2" }}
      >
        PROCEED
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={() => setExitMessage(false)}
      >
        <Close fontSize="small" />
      </IconButton>
    </>
  );

  return (
    <>
      {/* Header */}
      <AppBar
        sx={{
          position: "relative",
          backgroundColor: "#121212",
          color: "#1976d2",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setExitMessage(true)}
            aria-label="close"
          >
            <Close />
          </IconButton>
          <Typography
            sx={{ ml: 2, flex: 1, fontWeight: 600 }}
            variant="h6"
            component="div"
          >
            {albumTitle}
          </Typography>
          <MobileStepper
            variant="progress"
            steps={events.length}
            position="static"
            activeStep={activeStep}
            sx={{
              flex: 1.3,
              backgroundColor: "black",
              "& .MuiMobileStepper-progress": { width: "70%" },
            }}
            nextButton={
              <Tooltip title={nextEvent} placement="top" arrow>
                <Button
                  size="small"
                  onClick={handleNext}
                  disabled={activeStep === events.length - 1}
                  sx={{
                    width: 120,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {nextEvent.length > 10
                    ? `${nextEvent.slice(0, 8)}...`
                    : nextEvent}
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowLeft />
                  ) : (
                    <KeyboardArrowRight />
                  )}
                </Button>
              </Tooltip>
            }
            backButton={
              <Button
                size="small"
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                {theme.direction === "rtl" ? (
                  <KeyboardArrowRight />
                ) : (
                  <KeyboardArrowLeft />
                )}
                Previous
              </Button>
            }
          />
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "calc(100vh - 64px)",
          color: "black",
        }}
      >
        {/* Left: Image List */}
        <Box
          sx={{
            flex: 1,
            padding: 1.5,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <Box
            sx={{
              overflowY: "auto",
              minHeight: "calc(100vh - 64px - 300px)",
              maxHeight: "calc(100vh - 64px - 300px)",
            }}
          >
            {imagesLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <CircularProgress size="3.5rem" />
              </Box>
            ) : (
              <ImageList
                sx={{
                  width: "100%",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 2,
                }}
              >
                {imageData.map((item, index) => (
                  <ImageListItem
                    key={index}
                    onClick={() => handleImageSelect(item)}
                    sx={{
                      cursor: "pointer",
                      opacity: selectedImage?.url === item?.url ? 0.6 : 1,
                      transition: "opacity 0.3s ease",
                      "&:hover": {
                        opacity: selectedImage?.url === item?.url ? 0.6 : 0.8,
                      },
                    }}
                  >
                    <img
                      srcSet={`${item?.url}`}
                      src={`${item?.url}`}
                      crossorigin="anonymous"
                      alt={item?.metadata?.title}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <ImageListItemBar
                      title={item?.metadata?.title}
                      position="below"
                      sx={{
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        "& .MuiImageListItemBar-titleWrap": {
                          padding: "2px 0 6px",
                        },
                        "& .MuiImageListItemBar-title": {
                          fontSize: "0.9rem",
                        },
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
          <Box
            sx={{
              padding: 2,
              borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            <Typography variant="subtitle2" sx={{ marginBottom: 2 }}>
              {albumData.story}
            </Typography>
          </Box>
        </Box>

        {/* Right: Selected Image Display */}
        <Box
          sx={{
            flex: 1.3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 2,
            overflowY: "auto",
            // backgroundColor: "#f5f5f5",
          }}
        >
          {selectedImage ? (
            <>
              <Typography
                variant="h6"
                sx={{
                  marginBottom: "5px",
                  width: "100%",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {selectedImage?.metadata?.title}
              </Typography>
              <img
                src={selectedImage?.url}
                crossorigin="anonymous"
                alt={selectedImage?.metadata?.title}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  maxHeight: "600px",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
              <Typography component="label" sx={{ marginTop: 2 }}>
                Location: {selectedImage?.metadata?.location}
              </Typography>
            </>
          ) : (
            <Typography variant="h6">No image selected</Typography>
          )}
        </Box>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        open={exitMessage}
        autoHideDuration={10000}
        message="Once you exit, you will lose all the data!"
        onClose={() => setExitMessage(false)}
        action={action}
      />
    </>
  );
}
