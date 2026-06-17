from app.db.dao.invitations import InvitationDAO

def get_inv_dao() -> InvitationDAO:
    return InvitationDAO()