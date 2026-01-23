
class UserError(Exception):
    def __init__(self, message):
        self.message = message

class WeakPasswordError(UserError):
    def __init__(self, message = "The provided password is too weak."):
        super().__init__(message)
    
class UserNotFoundError(UserError):
    def __init__(self, message = "User not found."):
        super().__init__(message)

class InvalidCredentialsError(UserError):
    def __init__(self, message = "Invalid username or password."):
        super().__init__(message)

class UsernameAlreadyExistsError(UserError):
    def __init__(self, message = "Username already exists."):
        super().__init__(message)
