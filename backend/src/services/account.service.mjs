import { User } from "../models/index.mjs";
import { withTransaction } from "./ledger.service.mjs";

/**
 * Deletes a user and everything they own (stocks, buy lots, sell events) in
 * one transaction. The cascade itself lives on the User model, so any other
 * code path that deletes users gets the same behaviour.
 *
 * @returns {Promise<boolean>} true if the user existed and was deleted.
 */
export async function deleteUserAccount(userId) {
	return withTransaction(async (session) => {
		const deleted = await User.findOneAndDelete({ _id: userId }, { session });
		return Boolean(deleted);
	});
}
