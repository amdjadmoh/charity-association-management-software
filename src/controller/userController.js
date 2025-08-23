const { User } = require('../db/schema');
const { db } = require('../db');
const { eq } = require('drizzle-orm');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await db.select().from(User);
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await db.select().from(User).where(eq(User.id, req.params.id)).limit(1);
  
  if (!user.length) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user: user[0] }
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const newUser = await db.insert(User).values(req.body).returning();
  
  res.status(201).json({
    status: 'success',
    data: { user: newUser[0] }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await db.update(User)
    .set(req.body)
    .where(eq(User.id, req.params.id))
    .returning();

  if (!user.length) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user: user[0] }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await db.delete(User)
    .where(eq(User.id, req.params.id))
    .returning();

  if (!user.length) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.login= catchAsync(async (req, res, next) => {
  const {username, password} = req.body;
  if(!username || !password){
    return 
    next(new AppError('Please provide username and password', 400));
  }

  const user = await db.select().from(User).where(eq(User.username, username)).limit(1);
  if (!user.length) {
    return next(new AppError('No user found with that username', 404));
  }

  if (user[0].password !== password) {
    return next(new AppError('Incorrect password', 401));
  }

  res.status(200).json({
    status: 'success',
    data: { user: user[0] }
  });
}

)
