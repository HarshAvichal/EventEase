import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

const testPassword = 'Harsh01@';
const hashedPassword = '$2b$10$jBB91fN5af3FFeq9efROSOVeIDGbgaVRo8tuyVQifwmaqWYk.T6E6'; // Replace with DB hash

const testValidation = async () => {
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    // Should be true
};

testValidation();

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let organizerToken = '';
let participantToken = '';

// Test Data
const testOrganizer = {
    firstName: "Test",
    lastName: "Organizer",
    email: "organizer@test.com",
    password: "Test@123",
    role: "organizer"
};

const testParticipant = {
    firstName: "Test",
    lastName: "Participant",
    email: "participant@test.com",
    password: "Test@123",
    role: "participant"
};

const testEvent = {
    title: "Test Virtual Event",
    description: "This is a test virtual event",
    date: "2024-12-31",
    startTime: "14:00",
    endTime: "15:00",
    meetingLink: "https://meet.jit.si/test-event"
};

// Helper function to make API calls
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('Error:', error);
        return { status: 500, data: { message: error.message } };
    }
}

// Authentication Tests
async function testAuth() {
    // Register Organizer
    const registerOrg = await makeRequest('/auth/register', 'POST', testOrganizer);

    // Register Participant
    const registerPart = await makeRequest('/auth/register', 'POST', testParticipant);

    // Login Organizer
    const loginOrg = await makeRequest('/auth/login', 'POST', {
        email: testOrganizer.email,
        password: testOrganizer.password
    });
    if (loginOrg.data.token) organizerToken = loginOrg.data.token;

    // Login Participant
    const loginPart = await makeRequest('/auth/login', 'POST', {
        email: testParticipant.email,
        password: testParticipant.password
    });
    if (loginPart.data.token) participantToken = loginPart.data.token;
}

// Event Tests
async function testEvents() {
    // Create Event
    const createEvent = await makeRequest('/events/create', 'POST', testEvent, organizerToken);
    const eventId = createEvent.data.event?._id;

    // Get Organizer's Upcoming Events
    const upcomingEvents = await makeRequest('/events/organizer/upcoming', 'GET', null, organizerToken);

    // Get Event Details
    const eventDetails = await makeRequest(`/events/details/${eventId}`, 'GET', null, participantToken);

    // Search Events
    const searchEvents = await makeRequest('/events/search', 'GET');
}

// RSVP Tests
async function testRSVP() {
    // RSVP to Event
    const rsvp = await makeRequest('/rsvp/eventId', 'POST', null, participantToken);

    // Get Participant's Events
    const myEvents = await makeRequest('/events/participant/my-events', 'GET', null, participantToken);

    // Cancel RSVP
    const cancelRSVP = await makeRequest('/rsvp/eventId/cancel', 'POST', null, participantToken);
}

// Run all tests
async function runTests() {
    try {
        await testAuth();
        await testEvents();
        await testRSVP();
    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTests();
