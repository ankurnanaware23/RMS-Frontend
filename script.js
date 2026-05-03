document.addEventListener('DOMContentLoaded', () => {
    const usersList = document.getElementById('users-list');
    const fromUserSelect = document.getElementById('from-user');
    const toUserSelect = document.getElementById('to-user');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const sendRequestForm = document.getElementById('send-request-form');

    const API_URL = window.__BACKEND_API_BASE__;

    if (!API_URL) {
        throw new Error('Missing backend API base URL. Set VITE_BACKEND_API_BASE in Frontend/.env');
    }

    // Fetch and display users
    fetch(`${API_URL}/users/`)
        .then(response => response.json())
        .then(users => {
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user.name;
                usersList.appendChild(li);

                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                fromUserSelect.appendChild(option.cloneNode(true));
                toUserSelect.appendChild(option);
            });
        });

    // Fetch and display friend requests
    fetch(`${API_URL}/friend-requests/`)
        .then(response => response.json())
        .then(requests => {
            requests.forEach(request => {
                const li = document.createElement('li');
                li.textContent = `From: ${request.from_user} To: ${request.to_user} - ${request.is_accepted ? 'Accepted' : 'Pending'}`;
                friendRequestsList.appendChild(li);
            });
        });

    // Send friend request
    sendRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fromUser = fromUserSelect.value;
        const toUser = toUserSelect.value;

        fetch(`${API_URL}/friend-requests/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from_user: fromUser,
                to_user: toUser,
            }),
        })
        .then(response => response.json())
        .then(request => {
            const li = document.createElement('li');
            li.textContent = `From: ${request.from_user} To: ${request.to_user} - ${request.is_accepted ? 'Accepted' : 'Pending'}`;
            friendRequestsList.appendChild(li);
        });
    });
});
