import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const squares = document.querySelector(".squares")! as HTMLDivElement;

const squaresController: () => void = function () {
  squares.addEventListener("click", function (e: any) {
    if (e.target.matches(".square")) {
      const id = +e.target.getAttribute("id");
      socket.emit("player-moved", { square: id, socketId: socket.id });
    }
  });
};

const drawSquare = function (letter: string, square: number) {
  document.getElementById(`${square}`)!.textContent = letter;
};

const handleWin = function (socketId: string) {
  setTimeout(() => {
    alert(`Winner: ${socketId}`);
  });
};

const handleDraw = function () {
  setTimeout(() => {
    alert("Draw");
  });
};

socket.on("connect", () => {
  squaresController();

  socket.on(
    "player-move-response",
    function (data: { letter: string; square: number }) {
      const { letter, square } = data;

      drawSquare(letter, square);
    }
  );

  socket.on("winner", function (data: { socketId: string }) {
    handleWin(data.socketId);
  });

  socket.on("draw", handleDraw);
});
