import { ArrowForward, Close, Redo } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  MobileStepper,
  Skeleton,
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
import { LoadingButton } from "@mui/lab";

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
  const [imageData, setImageData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [exitMessage, setExitMessage] = useState(false);
  const [checkStepClick, setCheckStepClick] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [redoLoading, setRedoLoading] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const hasFetched = useRef(false);

  const theme = useTheme();

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      const imgData = new Array(albumData.count).fill(null);
      setImageData(imgData);
      fetchImages(albumData.count, albumData);
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
          event: events[activeStep],
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

  const fetchImages = (imgCount, albumMetadata) => {
    let images = new Array(imgCount).fill(null);

    const promises = Array.from({ length: imgCount }, (_, i) => {
      const data = {
        "album-id": albumMetadata.id,
        "image-index": i,
      };

      return axios
        .post("https://api.autobiographygallery.com/api/album-image", data)
        .then(
          (response) => {
            const image = response.data;
            images[i] = image;

            setImageData([...images]);
            if (i === 0) {
              setSelectedImage(image);
            }

            return { status: "fulfilled", value: image };
          },
          (error) => {
            console.error(`Error fetching image at index ${i}:`, error);
            return { status: "rejected", reason: error };
          }
        );
    });

    Promise.allSettled(promises).then(() => {
      const updatedAlbumMetadata = { ...albumMetadata, images: [...images] };
      setAlbumArr((prevAlbumArr) => [...prevAlbumArr, updatedAlbumMetadata]);
    });
  };

  const handleImageSelect = (item) => {
    setSelectedImage(item);
  };

  const handleNewAlbum = async (index) => {
    setSelectedImage(null);
    setStoryLoading(true);
    setImageData(new Array(4).fill(null));
    const data = {
      raw_memory: memoryInput,
      memory_elements: memoryElements,
      related_event: events[index],
    };
    try {
      const response = await axios.post(
        "https://api.autobiographygallery.com/api/generate-album",
        data
      );
      const albumMetadata = {
        count: response.data.size,
        id: response.data.id,
        title: response.data.title,
        story: response.data.story,
        event: events[index],
      };
      setAlbumData((prev) => ({
        ...prev,
        ...albumMetadata,
      }));
      setImageData(new Array(response.data.size).fill(null));
      setStoryLoading(false);
      setRedoLoading(false);
      setNextLoading(false);
      fetchImages(response.data.size, albumMetadata);
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
            <ImageList
              sx={{
                width: "100%",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 2,
              }}
            >
              {imageData.map((item, index) =>
                item ? (
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
                ) : (
                  <Skeleton
                    key={index}
                    variant="rectangular"
                    width="100%"
                    height={150}
                    sx={{ borderRadius: "8px" }}
                  />
                )
              )}
            </ImageList>
          </Box>
          <Box
            sx={{
              padding: 2,
              borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            {storyLoading ? (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={150}
                sx={{ borderRadius: 8 }}
              />
            ) : (
              <Typography variant="subtitle2" sx={{ marginBottom: 2 }}>
                {albumData.story}
              </Typography>
            )}
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
            <Skeleton
              variant="rectangular"
              width={600}
              height={600}
              sx={{ borderRadius: 8 }}
            />
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              mt: "80px",
            }}
          >
            <LoadingButton
              variant="contained"
              endIcon={<Redo />}
              loading={redoLoading}
              disabled={nextLoading}
              onClick={() => {
                setRedoLoading(true);
                handleNewAlbum(activeStep);
              }}
            >
              REGENERATE
            </LoadingButton>
            <LoadingButton
              variant="outlined"
              endIcon={<ArrowForward />}
              loading={nextLoading}
              disabled={activeStep === events.length - 1 || redoLoading}
              onClick={() => {
                setNextLoading(true);
                handleNext();
              }}
              sx={{ width: 155 }}
            >
              NEXT EVENT
            </LoadingButton>
          </Box>
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
