from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from .utils import calculate_read_time

class Tag(models.Model):
    name=models.CharField(max_length=100,unique=True)
    slug=models.SlugField(max_length=100,unique=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug=slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Topic (models.Model):
    name=models.CharField(max_length=100, unique=True)
    slug=models.SlugField(max_length=100, unique=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Story(models.Model):

    STATUS_CHOICES=[
        ('draft','Draft'),
        ('published','Published'),
        ('scheduled', 'Scheduled'),
    ]

    VISIBILITY_CHOICES=[
        ('free','Free'),
        ('member_only','Member_Only'),
    ]

    author=models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name='stories',)
    
    title=models.CharField(max_length=255)

    slug=models.SlugField(max_length=255,unique=True,blank=True)

    content=models.TextField()

    cover_image=models.ImageField(upload_to='stories/covers/',blank=True, null=True)

    status=models.CharField(max_length=20,choices=STATUS_CHOICES, default='draft')

    visibility=models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='free')

    tags = models.ManyToManyField(Tag,blank=True,related_name='stories')

    topics=models.ManyToManyField(Topic, blank=True, related_name='stories')

    scheduled_at=models.DateTimeField(blank=True, null=True)

    published_at=models.DateTimeField(blank=True, null=True)

    read_time=models.PositiveIntegerField(default=0)

    created_at=models.DateTimeField(auto_now_add=True)
    
    updated_at=models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        self.read_time = calculate_read_time(self.content)

        if self.status == 'published':
            if not self.published_at:
                self.published_at = timezone.now()
            self.scheduled_at = None

        elif self.status == 'scheduled':
            self.published_at = None

        else:
            self.published_at = None
            self.scheduled_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Comment(models.Model):
    story = models.ForeignKey(
        Story,
        on_delete = models.CASCADE,
        related_name = 'comments' 
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name='comments')

    parent = models.ForeignKey('self',
                               on_delete=models.CASCADE,
                               blank=True,
                               null=True,
                               related_name='replies'
                               )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} - {self.story.title}'



class Clap(models.Model):
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='claps'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='claps'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} clapped {self.story.title}'

class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following'
    )

    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['follower', 'following'],
                name='uniques_user_follow'
            ),
            models.CheckConstraint(
                condition=~models.Q(
                    follower=models.F('following')
                ),
                name='prevent_self_follow'
            ),
        ]

    def __str__(self):
        return f'{self.follower.username} follows {self.following.username}'

class ReadingList(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reading_list'
    )

    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'story'],
                name='unique_user_reading_list_story'
            )
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} saved {self.story.title}'