Core Mechanics / Features of Kahoot
EPIC 1:
	Create a quiz
	Edit a quiz
	Delete a quiz
EPIC 2:
	Search for quiz by topic or category
	Start a game session
	Generate a Game PIN
	Join the game via PIN + create a nickname
	Lobby (waiting room for players)
	Display the list of players
	Host starts the game
EPIC 3:
	Show question to all players
	Answer timer
	Player submits an answer
	Validate the answer
	Calculate scores
	Leaderboard after each question
	Move to the next question
	Show correct answer
	End the game
	Final player ranking
	Display the winner

Additional Features
Account:
	User registration and authentication - EPIC 1
	Save quizzes in a personal account - EPIC 1
	Search quizzes by title or topic for a specific user - EPIC 1
Additional Mechanics:
	Randomize question order - EPIC 3
	Randomize answer order - EPIC 3
	Support different question types (True/False, Multiple Choice, Numeric) - EPIC 1
	Configure time per question - EPIC 3
	Host can kick a player from the lobby - EPIC 2
Future nice to have
	Add images to questions - EPIC 1
	Add images to answers - EPIC 1
	Team mode
	Create a team
	Team leaderboard + individual leaderboard within the team
	Speedrun mode - player does not wait for others to answer and immediately receives the next question
	Score calculation with increased multiplier

User Stories

As an organizer, I want to be able to create/delete/modify a quiz. This includes creating a question with 2-10 possible answers, where multiple answers can be correct.
As an organizer, I want to be able to group my quizzes by topic or at least save them for future use.
As an organizer, I want to be able to randomize the order of answers so participants cannot easily copy answers from others.
As an organizer, I want to be able to adjust the time allowed for answering questions.
As an organizer, I want to be able to navigate to the next/previous question.
As an organizer, I want to be able to display the leaderboard at any time (or should it be shown automatically between questions instead?).
As a participant, I want to be able to choose a nickname.
As a participant, I want to be able to draw my own logo (this sounds complex).
As a participant, I want to see the correct answer and the leaderboard after submitting my answer.



Use Case Diagram (Roles and Actions)
Roles:
	Host (session creator)
	Creates a quiz
	Starts a game session
	Begins the questions
	Kicks a player
	Ends the game
	Views results
Player (participant)
	Joins a session via PIN
	Answers questions
	Sees their score
Admin (for managing users/quizzes)
	Blocks users
	Manages quizzes


Sequence Diagram (www.plantuml.com)

https://www.plantuml.com/plantuml/png/VKzBJiCm4DtFAMQPB7g1B52Ha6179SG1fl601kAFF9CWRW-sMobG9IlRxps_pr6Diir-0XejPZnDzCqPqYyeeoGAXe_a-OLL9OO_-5DK0qT6PrB6Xyi5e5dWuMxzSy2FAA7JzZf9w6755l7LO42bXJ6r8bSK3__zukVQeV8jUS0nXZV9laO2b9utRUhiWdJzfirxmOkEtUOgdSzUx3xe5-UEwh6pRA5971bVzFtEF1rZvirgbNrDZagttG7FImqwSd2pdtu0

@startuml
actor Player
participant GameSession
participant Host
database Database

Player -> GameSession: join(sessionPin)
GameSession -> Database: save player
Database --> GameSession: ok
GameSession --> Player: confirm join

Host -> GameSession: startGame()
GameSession --> Player: gameStarted

Player -> GameSession: submitAnswer(answer)
GameSession -> Database: validateAnswer()
Database --> GameSession: score
GameSession --> Player: scoreUpdated

GameSession --> Player: gameOver()
@enduml