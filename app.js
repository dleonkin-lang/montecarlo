const canvas = document.getElementById("experiment-canvas");
const ctx = canvas.getContext("2d");

const shapeSelect = document.getElementById("shape-select");
const shapeDescription = document.getElementById("shape-description");
const gridToggle = document.getElementById("grid-toggle");
const insideCountElement = document.getElementById("inside-count");
const outsideCountElement = document.getElementById("outside-count");
const lastPointElement = document.getElementById("last-point");
const customCountInput = document.getElementById("custom-count");
const customDropButton = document.getElementById("custom-drop-button");
const resetButton = document.getElementById("reset-button");

const MAX_VISIBLE_POINTS = 1000;

const triangle = [
  { x: 1, y: 1 },
  { x: 8, y: 2 },
  { x: 3, y: 9 },
];

const pentagon = [
  { x: 2, y: 1 },
  { x: 8, y: 1 },
  { x: 9, y: 5 },
  { x: 5, y: 9 },
  { x: 1, y: 5 },
];

const lake = [
  { x: 1.1, y: 4.2 },
  { x: 1.8, y: 6.3 },
  { x: 3.1, y: 7.8 },
  { x: 4.5, y: 7.1 },
  { x: 5.8, y: 8.6 },
  { x: 7.4, y: 7.5 },
  { x: 8.8, y: 5.8 },
  { x: 8.2, y: 4.1 },
  { x: 9.0, y: 2.7 },
  { x: 6.9, y: 1.8 },
  { x: 5.1, y: 2.4 },
  { x: 3.9, y: 1.5 },
  { x: 2.2, y: 2.4 },
];

const shapes = [
  {
    id: "triangle",
    name: "Косой треугольник",
    description: "Треугольник с тремя разными наклонными сторонами.",
    draw(ctx) {
      drawPolygonShape(ctx, triangle, "rgba(37, 99, 235, 0.22)", "#1d4ed8");
    },
    containsPoint(x, y) {
      return pointInPolygon({ x, y }, triangle);
    },
  },
  {
    id: "pentagon",
    name: "Пятиугольник",
    description: "Фигура с пятью сторонами внутри квадрата.",
    draw(ctx) {
      drawPolygonShape(ctx, pentagon, "rgba(245, 158, 11, 0.24)", "#b45309");
    },
    containsPoint(x, y) {
      return pointInPolygon({ x, y }, pentagon);
    },
  },
  {
    id: "circle",
    name: "Круг в квадрате",
    description: "Круг касается сторон квадрата сверху, снизу, слева и справа.",
    draw(ctx) {
      const center = mathToCanvas(5, 5);
      const radius = getLayout().plotSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20, 184, 166, 0.22)";
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    containsPoint(x, y) {
      const dx = x - 5;
      const dy = y - 5;
      return dx * dx + dy * dy <= 25;
    },
  },
  {
    id: "lake",
    name: "Озеро",
    description: "Неровная фигура, похожая на озеро на карте.",
    draw(ctx) {
      drawPolygonShape(ctx, lake, "rgba(14, 165, 233, 0.28)", "#0369a1");
    },
    containsPoint(x, y) {
      return pointInPolygon({ x, y }, lake);
    },
  },
];

let currentShapeId = shapes[0].id;
let visiblePoints = [];
let insideCount = 0;
let outsideCount = 0;

// Возвращает текущие размеры рабочей части canvas.
function getLayout() {
  const margin = {
    left: 72,
    right: 34,
    top: 34,
    bottom: 72,
  };
  const plotSize = Math.min(
    canvas.width - margin.left - margin.right,
    canvas.height - margin.top - margin.bottom
  );

  const left = margin.left + (canvas.width - margin.left - margin.right - plotSize) / 2;
  const top = margin.top + (canvas.height - margin.top - margin.bottom - plotSize) / 2;

  return {
    left,
    top,
    plotSize,
    right: left + plotSize,
    bottom: top + plotSize,
  };
}

// Переводит координаты из квадрата 10 на 10 в координаты canvas.
function mathToCanvas(x, y) {
  const layout = getLayout();
  const scale = layout.plotSize / 10;

  return {
    x: layout.left + x * scale,
    y: layout.top + (10 - y) * scale,
  };
}

// Рисует квадрат, подписи и, если включено, клетчатую сетку.
function drawGrid() {
  const layout = getLayout();
  const scale = layout.plotSize / 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fbfdff";
  ctx.fillRect(layout.left, layout.top, layout.plotSize, layout.plotSize);

  if (gridToggle.checked) {
    ctx.strokeStyle = "#d8e3ec";
    ctx.lineWidth = 1.5;

    for (let i = 0; i <= 10; i += 1) {
      const x = layout.left + i * scale;
      const y = layout.top + i * scale;

      ctx.beginPath();
      ctx.moveTo(x, layout.top);
      ctx.lineTo(x, layout.bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(layout.left, y);
      ctx.lineTo(layout.right, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#243447";
  ctx.lineWidth = 4;
  ctx.strokeRect(layout.left, layout.top, layout.plotSize, layout.plotSize);

  ctx.strokeStyle = "#243447";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#243447";
  ctx.font = "20px Arial, Helvetica, sans-serif";

  for (let i = 0; i <= 10; i += 1) {
    const x = layout.left + i * scale;
    const y = layout.bottom - i * scale;

    ctx.beginPath();
    ctx.moveTo(x, layout.bottom);
    ctx.lineTo(x, layout.bottom + 8);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(i), x, layout.bottom + 14);

    ctx.beginPath();
    ctx.moveTo(layout.left - 8, y);
    ctx.lineTo(layout.left, y);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i), layout.left - 14, y);
  }

  ctx.font = "bold 22px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("x", layout.right + 22, layout.bottom + 12);

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("y", layout.left - 14, layout.top - 18);

  ctx.restore();
}

// Рисует выбранную фигуру.
function drawShape() {
  getCurrentShape().draw(ctx);
}

// Рисует точки, которые остаются видимыми на поле.
function drawPoints() {
  const total = insideCount + outsideCount;
  const radius = total <= 300 ? 5.5 : total <= 1000 ? 3.5 : 2.6;

  ctx.save();

  for (const point of visiblePoints) {
    const canvasPoint = mathToCanvas(point.x, point.y);

    ctx.beginPath();
    ctx.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = point.inside ? "#15803d" : "#dc2626";
    ctx.fill();

    if (radius >= 5) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Добавляет случайные точки во весь квадрат 10 на 10.
function addRandomPoints(count) {
  const shape = getCurrentShape();
  let lastPoint = null;

  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    const inside = shape.containsPoint(x, y);

    if (inside) {
      insideCount += 1;
    } else {
      outsideCount += 1;
    }

    lastPoint = { x, y, inside };
    visiblePoints.push(lastPoint);
  }

  if (visiblePoints.length > MAX_VISIBLE_POINTS) {
    visiblePoints.splice(0, visiblePoints.length - MAX_VISIBLE_POINTS);
  }

  updateStats();
  lastPointElement.textContent =
    count === 1 && lastPoint
      ? `Последняя точка: ${lastPoint.inside ? "внутри" : "снаружи"}`
      : "";
  drawScene();
}

// Обновляет два счётчика на панели.
function updateStats() {
  insideCountElement.textContent = String(insideCount);
  outsideCountElement.textContent = String(outsideCount);
}

// Проверяет, находится ли точка внутри многоугольника или на его границе.
function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const previous = polygon[j];

    if (pointOnSegment(point, previous, current)) {
      return true;
    }

    const crossesLine = current.y > point.y !== previous.y > point.y;

    if (crossesLine) {
      const xOnLine =
        ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) +
        current.x;

      if (point.x < xOnLine) {
        inside = !inside;
      }
    }
  }

  return inside;
}

// Очищает точки и возвращает счётчики к нулю.
function resetExperiment() {
  visiblePoints = [];
  insideCount = 0;
  outsideCount = 0;
  lastPointElement.textContent = "";
  updateStats();
  drawScene();
}

function pointOnSegment(point, start, end) {
  const epsilon = 1e-9;
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);

  if (Math.abs(cross) > epsilon) {
    return false;
  }

  const dot =
    (point.x - start.x) * (point.x - end.x) +
    (point.y - start.y) * (point.y - end.y);

  return dot <= epsilon;
}

function drawPolygonShape(ctx, polygon, fillStyle, strokeStyle) {
  const first = mathToCanvas(polygon[0].x, polygon[0].y);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < polygon.length; i += 1) {
    const point = mathToCanvas(polygon[i].x, polygon[i].y);
    ctx.lineTo(point.x, point.y);
  }

  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function getCurrentShape() {
  return shapes.find((shape) => shape.id === currentShapeId) || shapes[0];
}

function drawScene() {
  drawGrid();
  drawShape();
  drawPoints();
}

function updateShapeDescription() {
  shapeDescription.textContent = getCurrentShape().description;
}

function fillShapeSelect() {
  for (const shape of shapes) {
    const option = document.createElement("option");
    option.value = shape.id;
    option.textContent = shape.name;
    shapeSelect.append(option);
  }

  shapeSelect.value = currentShapeId;
}

function readCustomCount() {
  const count = Math.floor(Number(customCountInput.value));

  if (!Number.isFinite(count) || count < 1) {
    customCountInput.value = "1";
    customCountInput.focus();
    return null;
  }

  const limitedCount = Math.min(count, 100000);
  customCountInput.value = String(limitedCount);
  return limitedCount;
}

fillShapeSelect();
updateShapeDescription();
updateStats();
drawScene();

document.querySelectorAll("[data-drop-count]").forEach((button) => {
  button.addEventListener("click", () => {
    addRandomPoints(Number(button.dataset.dropCount));
  });
});

customDropButton.addEventListener("click", () => {
  const count = readCustomCount();

  if (count !== null) {
    addRandomPoints(count);
  }
});

customCountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const count = readCustomCount();

    if (count !== null) {
      addRandomPoints(count);
    }
  }
});

shapeSelect.addEventListener("change", () => {
  currentShapeId = shapeSelect.value;
  updateShapeDescription();
  resetExperiment();
});

gridToggle.addEventListener("change", drawScene);
resetButton.addEventListener("click", resetExperiment);