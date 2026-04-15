document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?t=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants
          .map(
            (participant) =>
              `<li><span>${participant}</span><button class="delete-participant" data-email="${participant}" data-activity="${name}" title="Unregister">&#x1F5D1;</button></li>`
          )
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants (${details.participants.length})</p>
            <ul class="participants-list">
              ${participantsList || '<li class="empty-participant">No participants yet</li>'}
            </ul>
          </div>
        `;

        // Attach delete handlers to each participant item
        activityCard.querySelectorAll(".delete-participant").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const email = btn.dataset.email;
            const activity = btn.dataset.activity;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              if (res.ok) {
                await fetchActivities();
              } else {
                const result = await res.json();
                console.error("Error unregistering:", result.detail);
              }
            } catch (error) {
              console.error("Error unregistering participant:", error);
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle signup form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    if (!email || !activity) {
      messageDiv.textContent = "Please provide both an email and an activity.";
      messageDiv.className = "error";
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        const result = await response.json();
        messageDiv.textContent = result.detail || "Error signing up. Please try again.";
        messageDiv.className = "error";
      }
    } catch (error) {
      console.error("Error signing up:", error);
      messageDiv.textContent = "Error signing up. Please try again.";
      messageDiv.className = "error";
    }
  });

  // Initial data load
  fetchActivities();
});
