import enum


class TaskStatus(enum.Enum):
    created = "created"
    in_progress = "in_progress"
    completed = "completed"


class UserStatus(enum.Enum):
    base_user = "base_user"
    admin = "admin"
    manager = "manager"
    director = "director"


class ContentTypes(enum.Enum):
    txt = "txt"
    pdf = "pdf"
    docx = "docx"
    doc = "doc"
    png = "png"
    jpg = "jpg"
    jpeg = "jpeg"
    pptx = "pptx"
    xlsx = "xlsx"
    csv = "csv"

    mp3 = "mp3"
    wav = "wav"
    ogg = "ogg"

    mp4 = "mp4"
    mov = "mov"
    avi = "avi"
    mkv = "mkv"

    zip = "zip"
    rar = "rar"
    _7z = "7z"


class TaskPermission(enum.Enum):
    read = "read"
    edit = "edit"
    change_status = "change_status"
    assign = "assign"
    delete = "delete"


class LogLevel(enum.Enum):
    info = "info"
    warning = "warning"
    error = "error"
    critical = "critical"
