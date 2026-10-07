from rest_framework.permissions import BasePermission


class IsFreeMember(BasePermission):
    """
    Allows authenticated users who do not have active premium access.
    """

    message = "You must be a free member to perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)

        if profile and profile.has_active_premium:
            return False

        return True


class IsPremiumMember(BasePermission):
    """
    Allows authenticated users with active premium access.
    """

    message = "An active premium subscription is required."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)

        return bool(
            profile and profile.has_active_premium
        )


class IsAuthenticatedMember(BasePermission):
    """
    Allows any authenticated Inkwell member.
    """

    def has_permission(self, request, view):
        return bool(request.user.is_authenticated)
    

class IsStoryAuthor(BasePermission):
    """
    Allows access only to the author of the story.
    """

    message = "You can only modify your own stories."

    def has_object_permission(self, request, view, obj):
        return obj.author == request.user