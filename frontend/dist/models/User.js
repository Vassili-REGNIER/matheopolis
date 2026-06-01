export function displayName(user) {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName.length > 0 ? fullName : user.username;
}
