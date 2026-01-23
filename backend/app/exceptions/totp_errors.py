
class TotpError(Exception):
    def __init__(self, message : str):
        self.message = message

class TotpAlreadyEnabledError(TotpError):
    def __init__(self, message = "2FA is already enabled"):
        super().__init__(message)
    
class InvalidTotpTokenError(TotpError):
    def __init__(self, message = "Invalid 2FA token"):
        super().__init__(message)
