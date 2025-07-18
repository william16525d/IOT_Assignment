import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const CHANNEL_ID = 3008487; // Your ThingSpeak channel ID
const READ_API_KEY = "4E7OWSTNKK3PCWQ4"; // Your ThingSpeak read API key

// Map codes to event names
const eventMap = {
  1: "Trash Thrown",
  2: "Bin Full",
};

const POLL_INTERVAL = 10000; // 10 seconds

export default function App() {
  // Loading screen control
  const [loading, setLoading] = useState(true);

  // Events state
  const [trashEvents, setTrashEvents] = useState([]);
  const [binFullEvents, setBinFullEvents] = useState([]);

  // Clear dialogs state
  const [clearTrashOpen, setClearTrashOpen] = useState(false);
  const [clearBinFullOpen, setClearBinFullOpen] = useState(false);

  // Snackbar alert for Bin Full
  const [binFullAlert, setBinFullAlert] = useState(false);

  // Last cleared timestamps stored in localStorage keys
  const LOCALSTORAGE_TRASH = "smartbin-lastTrashClear";
  const LOCALSTORAGE_BINFULL = "smartbin-lastBinFullClear";

  const [lastTrashClear, setLastTrashClear] = useState(
    () => parseInt(localStorage.getItem(LOCALSTORAGE_TRASH)) || 0
  );
  const [lastBinFullClear, setLastBinFullClear] = useState(
    () => parseInt(localStorage.getItem(LOCALSTORAGE_BINFULL)) || 0
  );

  // Fetch ThingSpeak data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=50&api_key=${READ_API_KEY}`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      const feeds = data.feeds || [];

      // Filter and separate events by code and timestamp
      const newTrash = [];
      const newBinFull = [];

      feeds.forEach((feed) => {
        const code = feed.field1;
        if (!code) return;
        const time = new Date(feed.created_at).getTime();
        if (code === "1" && time > lastTrashClear) {
          newTrash.push({ id: feed.entry_id, time, code });
        } else if (code === "2" && time > lastBinFullClear) {
          newBinFull.push({ id: feed.entry_id, time, code });
        }
      });

      // Sort newest first
      newTrash.sort((a, b) => b.time - a.time);
      newBinFull.sort((a, b) => b.time - a.time);

      // Check if any new bin full events since last fetch (for alert)
      if (
        (binFullEvents.length === 0 && newBinFull.length > 0) ||
        (newBinFull.length > 0 &&
          newBinFull[0].time > (binFullEvents[0]?.time || 0))
      ) {
        setBinFullAlert(true);
      }

      setTrashEvents(newTrash);
      setBinFullEvents(newBinFull);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }, [lastTrashClear, lastBinFullClear, binFullEvents]);

  useEffect(() => {
    // Show loading splash for 2 seconds
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Clear handlers
  function handleClearTrash() {
    localStorage.setItem(LOCALSTORAGE_TRASH, Date.now().toString());
    setLastTrashClear(Date.now());
    setTrashEvents([]);
    setClearTrashOpen(false);
  }

  function handleClearBinFull() {
    // Clear both bin full and trash
    const now = Date.now();
    localStorage.setItem(LOCALSTORAGE_BINFULL, now.toString());
    localStorage.setItem(LOCALSTORAGE_TRASH, now.toString());
    setLastBinFullClear(now);
    setLastTrashClear(now);
    setBinFullEvents([]);
    setTrashEvents([]);
    setClearBinFullOpen(false);
    setBinFullAlert(false);
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: "100vh",
        bgcolor: "#121212",
        color: "#eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 2,
        fontFamily: "Roboto, sans-serif",
      }}
    >
      {/* Loading splash */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "#1976d2",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              zIndex: 9999,
              color: "#fff",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{
                border: "5px solid #fff",
                borderTop: "5px solid transparent",
                borderRadius: "50%",
                width: 60,
                height: 60,
                marginBottom: 20,
              }}
            />
            Welcome to Smart Bin Monitor
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold", mt: loading ? 0 : 4 }}
      >
        Smart Bin Event Monitor
      </Typography>

      {/* Container for events */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          width: "100%",
          maxWidth: 600,
        }}
      >
        {/* Trash Thrown Card */}
        <Card sx={{ flex: 1 }}>
          <CardHeader
            title="Trash Thrown"
            subheader={`${trashEvents.length} event${
              trashEvents.length !== 1 ? "s" : ""
            }`}
          />
          <CardContent sx={{ maxHeight: 300, overflowY: "auto" }}>
            {trashEvents.length === 0 ? (
              <Typography sx={{ fontStyle: "italic", textAlign: "center" }}>
                No new trash thrown events
              </Typography>
            ) : (
              <List dense>
                {trashEvents.map(({ id, time }) => (
                  <ListItem key={id}>
                    <ListItemText
                      primary={new Date(time).toLocaleString()}
                      secondary="Trash Thrown"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
          <Box textAlign="center" mb={1}>
            <Button
              variant="outlined"
              color="primary"
              disabled={trashEvents.length === 0}
              onClick={() => setClearTrashOpen(true)}
              sx={{ m: 1, width: "80%" }}
            >
              Clear Trash Events
            </Button>
          </Box>
        </Card>

        {/* Bin Full Card */}
        <Card sx={{ flex: 1 }}>
          <CardHeader
            title="Bin Full"
            subheader={`${binFullEvents.length} event${
              binFullEvents.length !== 1 ? "s" : ""
            }`}
          />
          <CardContent sx={{ maxHeight: 300, overflowY: "auto" }}>
            {binFullEvents.length === 0 ? (
              <Typography sx={{ fontStyle: "italic", textAlign: "center" }}>
                No new bin full events
              </Typography>
            ) : (
              <List dense>
                {binFullEvents.map(({ id, time }) => (
                  <ListItem key={id}>
                    <ListItemText
                      primary={new Date(time).toLocaleString()}
                      secondary="Bin Full"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
          <Box textAlign="center" mb={1}>
            <Button
              variant="contained"
              color="error"
              disabled={binFullEvents.length === 0}
              onClick={() => setClearBinFullOpen(true)}
              sx={{ m: 1, width: "80%" }}
            >
              Clear Bin Full & Trash Events
            </Button>
          </Box>
        </Card>
      </Box>

      {/* Clear Trash Confirmation Dialog */}
      <Dialog open={clearTrashOpen} onClose={() => setClearTrashOpen(false)}>
        <DialogTitle>Clear Trash Events?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all trash thrown events?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearTrashOpen(false)}>Cancel</Button>
          <Button
            onClick={handleClearTrash}
            color="primary"
            variant="contained"
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Bin Full Confirmation Dialog */}
      <Dialog
        open={clearBinFullOpen}
        onClose={() => setClearBinFullOpen(false)}
      >
        <DialogTitle>Clear Bin Full & Trash Events?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all bin full events <br /> and all
            trash thrown events?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearBinFullOpen(false)}>Cancel</Button>
          <Button
            onClick={handleClearBinFull}
            color="error"
            variant="contained"
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bin Full Alert Snackbar */}
      <Snackbar
        open={binFullAlert}
        autoHideDuration={8000}
        onClose={() => setBinFullAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setBinFullAlert(false)}
          severity="warning"
          sx={{ width: "100%" }}
          variant="filled"
        >
          🚨 Bin is Full! Please clean it ASAP.
        </Alert>
      </Snackbar>
    </Box>
  );
}
