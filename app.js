const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initilizeDBAndServer();

const checkRequestsQueries = async (request, response, next) => {
  const { search_q = "", category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return 0;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const checkRequestsBody = async (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.id = id;
  request.todo = todo;
  next();
};

//Get Todos API-1
app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const {
    search_q = "",
    status = "",
    category = "",
    priority = "",
  } = request.query;
  const getTodosQuery = `
        SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%' AND status LIKE '%${status}%' AND category LIKE '%${category}%' AND priority LIKE '%${priority}%'`;
  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  const getsTodoQuery = `
        SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const todosArray = await db.get(getsTodoQuery);
  response.send(todosArray);
});

app.get("/agenda/", checkRequestsQueries, async (request, response) => {
  const { date } = request;

  const selectDueDateQuery = `
        SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            due_date = '${date}';`;
  const todosArray = await db.all(selectDueDateQuery);
  if (todosArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todosArray);
  }
});

app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;
  const addTodosQuery = `
        INSERT INTO
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${dueDate}'
            );`;

  const valueArray = await db.run(addTodosQuery);
  const lastid = valueArray.lastId;
  console.log(valueArray);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", checkRequestsBody, async (request, response) => {
  const { todoId } = request.params;

  const { priority, todo, status, dueDate, category } = request.body;
  let updateTodoQuery = null;
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    status = '${status}'
                WHERE
                    id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET
                priority = '${priority}'
            WHERE
                id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case category !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET
                category = '${category}'
            WHERE
                id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET
                todo = '${todo}'
            WHERE
                id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
                UPDATE
                    todo
                SET
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
