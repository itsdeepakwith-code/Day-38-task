const express = require("express");
const app = express();
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// In-memory data storage (replace with a database for production)
let rooms = [
  
];
let bookings = [];

// Function to check for overlapping bookings
function isRoomAvailable(roomId, date, startTime, endTime) {
  return bookings.every((booking) => {
    return (
      booking.roomId !== roomId ||
      !(
        (startTime < booking.endTime && endTime > booking.startTime) ||
        (startTime === booking.startTime && endTime === booking.endTime)
      )
    );
  });
}

// Create a room (POST request to /rooms)
app.post("/rooms", (req, res) => {
  const { name, seats, amenities, price } = req.body;

  if (!name || !seats || !amenities || !price) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  rooms.push({ id: rooms.length + 1, name, seats, amenities, price });
  res.status(201).json({ message: "Room created successfully" });
});

// Book a room (POST request to /bookings)
app.post("/bookings", (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  if (!customerName || !date || !startTime || !endTime || !roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!isRoomAvailable(roomId, date, startTime, endTime)) {
    return res.status(409).json({ message: "Room is already booked" });
  }

  const bookingId = bookings.length + 1;
  bookings.push({
    id: bookingId,
    customerName,
    date,
    startTime,
    endTime,
    roomId,
    status: "confirmed", // Add booking status
  });

  res.status(201).json({ message: "Room booked successfully", bookingId });
});

// List all rooms with booked data (GET request to /rooms)
app.get("/rooms", (req, res) => {
  const allRooms = rooms.map((room) => {
    const booked = bookings.find((booking) => booking.roomId === room.id);
    return {
      ...room,
      bookedStatus: booked ? "booked" : "available",
      customerName: booked ? booked.customerName : null,
      date: booked ? booked.date : null,
      startTime: booked ? booked.startTime : null,
      endTime: booked ? booked.endTime : null,
    };
  });

  res.json(allRooms);
});

// List all customers with booked data (GET request to /customers)
app.get("/customers", (req, res) => {
  const customerBookings = bookings.map((booking) => {
    const room = rooms.find((room) => room.id === booking.roomId);
    return {
      customerName: booking.customerName,
      roomName: room.name,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingId: booking.id,
      bookingDate: new Date(booking.bookingDate).toLocaleDateString(), // Format booking date
      bookingStatus: booking.status,
    };
  });

  res.json(customerBookings);
});

// List customer's bookings with details (GET request to /customers/:customerId)
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const customerBookings = bookings.filter(
    (booking) => booking.customerName === customerId
  );

  if (!customerBookings.length) {
    return res
      .status(404)
      .json({ message: "No bookings found for this customer" });
  }

  const detailedBookings = customerBookings.map((booking) => {
    const room = rooms.find((room) => room.id === booking.roomId);
    return {
      customerName: booking.customerName,
      roomName: room.name,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingId: booking.id,
      bookingDate: new Date(booking.bookingDate).toLocaleDateString(),
      bookingStatus: booking.status,
    };
  });

  res.json(detailedBookings);
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
