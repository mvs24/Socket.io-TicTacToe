import http from "http";
import express from "express";
import { Server, Socket } from "socket.io";
import { winCombinations } from "./winCombinations";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:1234",
  },
});

interface State {
  players: {
    id: string;
    squares: number[];
  }[];
  turn: string;
  lastPlayerTurn: string;
  winner: boolean;
  letters: {
    id: string;
    letter: string;
  }[];
  checkedSquares: number[];
}
const state: State = {
  players: [],
  turn: "",
  lastPlayerTurn: "",
  winner: false,
  letters: [],
  checkedSquares: [],
};

const updatePlayers = function (socket: Socket) {
  const socketId = socket.id;
  state.players.push({ id: socketId, squares: [] });
  if (state.letters.length === 0) {
    state.letters.push({
      id: socketId,
      letter: "X",
    });
  } else {
    state.letters.push({
      id: socketId,
      letter: "O",
    });
  }
};

const updateTurn = function (socketId: string) {
  state.turn = socketId;
  state.lastPlayerTurn = socketId;
};

const changeTurn = function (socketId: string) {
  const otherPlayer = state.players.find((player) => player.id !== socketId)!;
  const otherTurn = otherPlayer.id;
  state.turn = otherTurn;
};

const checkForWinner: (squares: number[]) => boolean = (squares: number[]) => {
  let playerSorted = squares.sort();
  let isWinner = false;

  winCombinations.forEach((winCombo) => {
    let isCombo = 0;
    playerSorted.forEach((nr) => {
      if (winCombo.includes(nr)) {
        isCombo++;
      }
    });

    if (isCombo === 3) {
      isWinner = true;
    }
  });

  return isWinner;
};

const controlWinner = function (squares: number[], socketId: string) {
  const hasWinner = checkForWinner(squares);
  if (hasWinner) {
    state.winner = true;
    io.emit("winner", { socketId });
  }
};

const controlDraw = function () {
  if (state.checkedSquares.length === 9 && state.winner === false) {
    io.emit("draw");
  }
};

const isSquareChecked = function (square: number) {
  return !!state.checkedSquares.includes(square);
};

const proceedPlayerMove = function (square: number, socketId: string) {
  if (state.turn === socketId && !isSquareChecked(square)) {
    const player = state.players.find((player) => player.id === socketId)!;
    player.squares.push(square);
    state.checkedSquares.push(square);

    controlWinner(player.squares, socketId);
    controlDraw();

    io.emit("player-move-response", {
      square,
      letter: getLetter(socketId),
    });
    changeTurn(socketId);
  }
};

const getLetter = (socketId: string) =>
  state.letters.find((el) => el.id === socketId)?.letter;

io.on("connection", (socket: Socket) => {
  updatePlayers(socket);

  socket.on(
    "player-moved",
    function (data: { square: number; socketId: string }) {
      const { square, socketId } = data;

      if (state.turn === "") {
        updateTurn(socketId);
      }

      proceedPlayerMove(square, socketId);
    }
  );
});

const PORT = 5000;
server.listen(PORT, () => console.log(`App running on port ${PORT}`));
