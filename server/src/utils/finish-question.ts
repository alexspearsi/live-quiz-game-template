import { Game } from '../types';
import { broadcastQuestion } from './broadcast-question';
import { broadcastToAll } from './broadcast-to-all';
import type { WebSocket } from 'ws';

export function finishQuestion(connection: WebSocket, game: Game) {
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);

    game.questionTimer = undefined;
  }

  const question = game.questions[game.currentQuestion];
  const basePoints = 1000;

  const playerResults = game.players.map(player => {
    const answer = game.playerAnswers.get(player.index);
    const answered = !!answer;
    const correct = answered && answer!.answerIndex === question.correctIndex;

    let pointsEarned = 0;

    if (correct) {
      const timeRemaining = question.timeLimitSec - (answer!.timestamp - game.questionStartTime!) / 1000;

      pointsEarned = Math.round(basePoints * (Math.max(0, timeRemaining) / question.timeLimitSec));

      player.score += pointsEarned;
    }

    return {
      name: player.name,
      answered,
      correct,
      pointsEarned,
      totalScore: player.score,
    };
  });


  broadcastToAll(connection, game, {
    type: "question_result",
    data: {
      questionIndex: game.currentQuestion,
      correctIndex: question.correctIndex,
      playerResults,
    },
    id: 0,
  });

  const isLastQuestion = game.currentQuestion === game.questions.length - 1;

  if (isLastQuestion) {
    game.status = 'finished';

    const sorted = [...game.players].sort((a, b) => b.score - a.score);

    const scoreboard = sorted.map((player, i) => ({
      name: player.name,
      score: player.score,
      rank: i + 1,
    }));

    broadcastToAll(
      connection, 
      game, 
      { type: "game_finished", data: { scoreboard }, id: 0 });
      
  } else {
    game.currentQuestion += 1;

    broadcastQuestion(connection, game);
  }
}