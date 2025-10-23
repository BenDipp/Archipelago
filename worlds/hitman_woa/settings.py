import settings

class HitmanSettings(settings.Group):
    class PeacockUrl(str):
        """The url on which the Peacock-Server is running. Leave it as \"localhost\" if the server is hosted on the same machine as the client."""

    peacock_url: PeacockUrl = PeacockUrl("localhost")
