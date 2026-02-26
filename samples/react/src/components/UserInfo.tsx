import { useMsal } from "@azure/msal-react";
import { use, useState } from "react";
import { getUser } from "../auth/getUser";

export default function UserInfo() {
	const { instance } = useMsal();
	const [userPromise] = useState(() => getUser(instance));
	const user = use(userPromise);

	return (
		<div>
			<h2>User Information</h2>
			<table>
				<tbody>
					<tr>
						<th>Name:</th>
						<td>{user.displayName}</td>
					</tr>
					<tr>
						<th>Email:</th>
						<td>{user.mail}</td>
					</tr>
				</tbody>
				<tbody>
					<tr>
						<th>Phone:</th>
						<td>{user.mobilePhone}</td>
					</tr>
					<tr>
						<th>Office:</th>
						<td>{user.officeLocation}</td>
					</tr>
				</tbody>
				<tbody>
					<tr>
						<th>Phone:</th>
						<td>{user.mobilePhone}</td>
					</tr>
					<tr>
						<th>Office:</th>
						<td>{user.officeLocation}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
