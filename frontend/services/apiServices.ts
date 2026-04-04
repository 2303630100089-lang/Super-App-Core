import api from './api';

// ==========================================
// SETTINGS
// ==========================================
export const getSettings = async (userId: string) => {
  const { data } = await api.get(`/settings/${userId}`);
  return data;
};

export const updateSettings = async (userId: string, section: string, updateData: any) => {
  const { data } = await api.patch(`/settings/${userId}/${section}`, updateData);
  return data;
};

// ==========================================
// CHAT
// ==========================================
export const getChatMessages = async (chatId: string) => {
  const { data } = await api.get(`/chats/messages/${chatId}`);
  return data;
};

export const createChat = async (chatData: any) => {
  const { data } = await api.post('/chats', chatData);
  return data;
};

// ==========================================
// SOCIAL / FEED
// ==========================================
export const getSocialFeed = async (userId: string) => {
  const { data } = await api.post(`/social/feed`, { followingIds: [userId] });
  return data;
};

// ==========================================
// MARKETPLACE
// ==========================================
export const getMarketplaceProducts = async () => {
  const { data } = await api.get('/marketplace/products');
  return data;
};

export const getProductById = async (id: string) => {
  const { data } = await api.get(`/marketplace/products/${id}`);
  return data;
};

export const createProduct = async (productData: any) => {
  const { data } = await api.post('/marketplace/products', productData);
  return data;
};

export const markProductSold = async (id: string) => {
  const { data } = await api.patch(`/marketplace/products/${id}/sold`);
  return data;
};

// ==========================================
// CART
// ==========================================
export const getCart = async (userId: string) => {
  const { data } = await api.get(`/cart/${userId}`);
  return data;
};

export const addToCart = async (userId: string, productId: string, quantity: number, price: number) => {
  const { data } = await api.post('/cart/add', { userId, productId, quantity, price });
  return data;
};

export const removeFromCart = async (itemId: string) => {
  const { data } = await api.delete(`/cart/${itemId}`);
  return data;
};

// ==========================================
// ORDERS
// ==========================================
export const getOrders = async (userId: string) => {
  const { data } = await api.get(`/orders/user/${userId}`);
  return data;
};

export const placeOrder = async (orderData: any) => {
  const { data } = await api.post('/orders/place', orderData);
  return data;
};

// ==========================================
// DATING
// ==========================================
export const getDatingProfile = async (userId: string) => {
  const { data } = await api.get(`/dating/profile/${userId}`);
  return data;
};

export const updateDatingProfile = async (profileData: any) => {
  const { data } = await api.post('/dating/profile', profileData);
  return data;
};

export const swipeDating = async (userId: string, targetUserId: string, action: 'like' | 'dislike', type?: 'like' | 'pass' | 'super_like') => {
  const { data } = await api.post('/dating/swipe', { userId, targetUserId, action, type });
  return data;
};

export const rewindDating = async (userId: string) => {
  const { data } = await api.post('/dating/rewind', { userId });
  return data;
};

export const boostDating = async (userId: string) => {
  const { data } = await api.post('/dating/boost', { userId });
  return data;
};

export const getDatingMatches = async (userId: string) => {
  const { data } = await api.get(`/dating/matches/${userId}`);
  return data;
};

export const getRandomDatingProfiles = async (userId?: string) => {
  const { data } = await api.get(`/dating/random${userId ? `?userId=${userId}` : ''}`);
  return data;
};

export const joinBlindDate = async (userId: string) => {
  const { data } = await api.post('/dating/blind-date/join', { userId });
  return data;
};

export const revealBlindIdentity = async (userId: string, matchId: string) => {
  const { data } = await api.post('/dating/blind-date/reveal', { userId, matchId });
  return data;
};

// ==========================================
// PRODUCTIVITY (Forms, Notes/Notion)
// ==========================================

// Workspaces (Notion-style)
export const createWorkspace = async (workspaceData: any) => {
  const { data } = await api.post('/productivity/workspaces', workspaceData);
  return data;
};

export const getWorkspaces = async (userId: string) => {
  const { data } = await api.get(`/productivity/workspaces/user/${userId}`);
  return data;
};

// Pages (Notion-style)
export const createPage = async (pageData: any) => {
  const { data } = await api.post('/productivity/pages', pageData);
  return data;
};

export const getPage = async (pageId: string) => {
  const { data } = await api.get(`/productivity/pages/${pageId}`);
  return data;
};

export const updatePage = async (pageId: string, content: any) => {
  const { data } = await api.patch(`/productivity/pages/${pageId}`, content);
  return data;
};

export const getWorkspacePages = async (workspaceId: string) => {
  const { data } = await api.get(`/productivity/workspaces/${workspaceId}/pages`);
  return data;
};

// Forms
export const createForm = async (formData: any) => {
  const { data } = await api.post('/productivity/forms', formData);
  return data;
};

export const getUserForms = async (userId: string) => {
  const { data } = await api.get(`/productivity/forms/user/${userId}`);
  return data;
};

export const getFormById = async (id: string) => {
  const { data } = await api.get(`/productivity/forms/${id}`);
  return data;
};

export const submitFormResponse = async (id: string, responses: any) => {
  const { data } = await api.post(`/productivity/forms/${id}/submit`, responses);
  return data;
};

// ==========================================
// PROFESSIONAL (LinkedIn-style)
// ==========================================
export const getProfessionalProfile = async (userId: string) => {
  const { data } = await api.get(`/professional/profile/${userId}`);
  return data;
};

export const updateProfessionalProfile = async (profileData: any) => {
  const { data } = await api.post('/professional/profile', profileData);
  return data;
};

export const sendConnectionRequest = async (fromUser: string, toUser: string) => {
  const { data } = await api.post('/professional/connect', { fromUser, toUser });
  return data;
};

export const respondToConnection = async (requestId: string, action: 'accept' | 'reject') => {
  const { data } = await api.post('/professional/connect/respond', { requestId, action });
  return data;
};

export const getConnections = async (userId: string) => {
  const { data } = await api.get(`/professional/connections/${userId}`);
  return data;
};

export const getJobs = async () => {
  const { data } = await api.get('/professional/jobs');
  return data;
};

export const postJob = async (jobData: any) => {
  const { data } = await api.post('/professional/jobs', jobData);
  return data;
};

export const applyToJob = async (jobId: string, userId: string, coverLetter: string) => {
  const { data } = await api.post('/professional/jobs/apply', { jobId, userId, coverLetter });
  return data;
};

export const getJobApplications = async (jobId: string) => {
  const { data } = await api.get(`/professional/jobs/${jobId}/applications`);
  return data;
};

// ==========================================
// NOTIFICATIONS
// ==========================================
export const getNotifications = async (userId: string) => {
  const { data } = await api.get(`/notifications/${userId}`);
  return data;
};

export const markNotificationRead = async (notificationId: string) => {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data;
};

export const markAllNotificationsRead = async (userId: string) => {
  const { data } = await api.post(`/notifications/${userId}/read-all`);
  return data;
};

// ==========================================
// RIDES
// ==========================================
export const requestRide = async (rideData: any) => {
  const { data } = await api.post('/rides/request', rideData);
  return data;
};

export const getRideStatus = async (rideId: string) => {
  const { data } = await api.get(`/rides/${rideId}`);
  return data;
};

export const cancelRide = async (rideId: string) => {
  const { data } = await api.post(`/rides/${rideId}/cancel`);
  return data;
};

// ==========================================
// FOOD DELIVERY
// ==========================================
export const getRestaurants = async () => {
  const { data } = await api.get('/food/restaurants');
  return data;
};

export const getRestaurantMenu = async (restaurantId: string) => {
  const { data } = await api.get(`/food/restaurants/${restaurantId}/menu`);
  return data;
};

export const placeFoodOrder = async (orderData: any) => {
  const { data } = await api.post('/food/orders', orderData);
  return data;
};

export const getFoodOrderHistory = async (userId: string) => {
  const { data } = await api.get(`/food/orders/history/${userId}`);
  return data;
};

// ==========================================
// AI SERVICE
// ==========================================
export const askAI = async (message: string) => {
  const { data } = await api.post('/ai/chat', { message });
  return data;
};

// ==========================================
// SEARCH
// ==========================================
export const globalSearch = async (query: string) => {
  const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return data;
};

// ==========================================
// POLLS / ENGAGEMENT
// ==========================================
export const votePoll = async (pollId: string, optionIndex: number, userId: string) => {
  const { data } = await api.post('/super-comm/engagement/poll/vote', { pollId, optionIndex, userId });
  return data;
};

// ==========================================
// GAMES
// ==========================================
export const startGame = async (gameType: string, chatId: string) => {
  const { data } = await api.post('/advanced-interactions/games/start', { gameType, chatId });
  return data;
};

export const getCodingTopics = async () => {
    const { data } = await api.get('/professional/coding-topics');
    return data;
};

// ==========================================
// CODING DISCUSSIONS
// ==========================================
export const getCodingDiscussions = async (topic?: string) => {
  const params = topic ? `?topic=${encodeURIComponent(topic)}` : '';
  const { data } = await api.get(`/professional/coding-discussions${params}`);
  return data;
};

export const createCodingDiscussion = async (discussionData: any) => {
  const { data } = await api.post('/professional/coding-discussions', discussionData);
  return data;
};

export const likeDiscussion = async (discussionId: string) => {
  const { data } = await api.post(`/professional/coding-discussions/${discussionId}/like`);
  return data;
};

// ==========================================
// TASKS
// ==========================================
export const getTasks = async () => {
  const { data } = await api.get('/productivity/tasks');
  return data;
};

export const createTask = async (taskData: any) => {
  const { data } = await api.post('/productivity/tasks', taskData);
  return data;
};

export const updateTask = async (taskId: string, updateData: any) => {
  const { data } = await api.patch(`/productivity/tasks/${taskId}`, updateData);
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { data } = await api.delete(`/productivity/tasks/${taskId}`);
  return data;
};

// ==========================================
// CALENDAR EVENTS
// ==========================================
export const getCalendarEvents = async (month?: number, year?: number) => {
  const params = month && year ? `?month=${month}&year=${year}` : '';
  const { data } = await api.get(`/productivity/calendar${params}`);
  return data;
};

export const createCalendarEvent = async (eventData: any) => {
  const { data } = await api.post('/productivity/calendar', eventData);
  return data;
};

export const updateCalendarEvent = async (eventId: string, updateData: any) => {
  const { data } = await api.patch(`/productivity/calendar/${eventId}`, updateData);
  return data;
};

export const deleteCalendarEvent = async (eventId: string) => {
  const { data } = await api.delete(`/productivity/calendar/${eventId}`);
  return data;
};

// ==========================================
// CALLS
// ==========================================
export const getCallHistory = async () => {
  const { data } = await api.get('/super-comm/call/history/me');
  return data;
};

export const startCall = async (callData: any) => {
  const { data } = await api.post('/super-comm/call/start', callData);
  return data;
};

export const endCall = async (callId: string, status: string) => {
  const { data } = await api.post('/super-comm/call/end', { callId, status });
  return data;
};

// ==========================================
// GAMES (leaderboard + rooms)
// ==========================================
export const getGameLeaderboard = async () => {
  const { data } = await api.get('/games/leaderboard');
  return data;
};

export const getPublicRooms = async () => {
  const { data } = await api.get('/games/rooms/public');
  return data;
};

export const createGameRoom = async (roomData: any) => {
  const { data } = await api.post('/games/rooms', roomData);
  return data;
};

export const joinGameRoom = async (roomCode: string, userId: string, userName: string, avatar?: string) => {
  const { data } = await api.post('/games/rooms/join', { roomCode, userId, userName, avatar });
  return data;
};

// ==========================================
// LIVE STREAMING
// ==========================================
export const getLiveStreams = async (category?: string) => {
  const params = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const { data } = await api.get(`/super-comm/live${params}`);
  return data;
};

export const startLiveStream = async (streamData: any) => {
  const { data } = await api.post('/super-comm/live/start', streamData);
  return data;
};

export const endLiveStream = async (streamId: string) => {
  const { data } = await api.post(`/super-comm/live/${streamId}/end`);
  return data;
};

export const joinLiveStream = async (streamId: string) => {
  const { data } = await api.post(`/super-comm/live/${streamId}/join`);
  return data;
};

export const leaveLiveStream = async (streamId: string) => {
  const { data } = await api.post(`/super-comm/live/${streamId}/leave`);
  return data;
};
