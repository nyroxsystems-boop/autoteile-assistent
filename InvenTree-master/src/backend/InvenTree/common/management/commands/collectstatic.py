from django.contrib.staticfiles.management.commands.collectstatic import Command as BaseCommand


class Command(BaseCommand):
    """
    Render / Django default ignore patterns contain '.*' which skips '.vite/manifest.json'.
    This overrides the command to NOT ignore dot-directories.
    """

    def handle(self, **options):
        # Django defaults usually include: ['CVS', '.*', '*~']
        if hasattr(self, "default_ignore_patterns"):
            self.default_ignore_patterns = [
                p for p in self.default_ignore_patterns if p != ".*"
            ]
        return super().handle(**options)
