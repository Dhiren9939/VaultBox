import { ErrorResponse, SuccessResponse } from '#src/utils/response.js';
import UserExistsError from '#src/errors/UserExistsError.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';
import {
  deleteUserAccount,
  getUserProfile,
  getUserPublicProfile,
  updateUserProfile,
} from '#src/modules/user/user.service.js';

async function handleGetUser(req, res) {
  try {
    const email = req.query.email;
    if (email) {
      const publicUser = await getUserPublicProfile(email);
      return SuccessResponse(
        res,
        { user: publicUser },
        'User fetched successfully.',
        200
      );
    }
    const userId = req.user.id;
    const user = await getUserProfile(userId);
    return SuccessResponse(res, { user }, 'User fetched successfully.', 200);
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleUpdateUser(req, res) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    const user = await updateUserProfile(userId, {
      firstName,
      lastName,
      email,
    });

    return SuccessResponse(res, { user }, 'User updated successfully.', 200);
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    if (error instanceof UserExistsError)
      return ErrorResponse(res, {}, error.message, 409);
    throw error;
  }
}

async function handleDeleteUser(req, res) {
  try {
    const userId = req.user.id;
    const result = await deleteUserAccount(userId);
    return SuccessResponse(res, result, 'User deleted successfully.', 200);
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

export { handleGetUser, handleUpdateUser, handleDeleteUser };
